#!/usr/bin/env python3
"""Prepare an encrypted, private S3 state bucket in an explicitly checked AWS account.

This script creates AWS resources only when run by the user. It does not run
Terraform or create Amplify apps.
"""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path


OUTPUT = Path(__file__).resolve().parents[1] / "terraform" / "backends" / "personal.s3.tfbackend"


def aws(profile: str, region: str, *arguments: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["aws", *arguments, "--profile", profile, "--region", region, "--output", "json"],
        capture_output=True,
        text=True,
    )


def required_aws(profile: str, region: str, *arguments: str) -> subprocess.CompletedProcess[str]:
    result = aws(profile, region, *arguments)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "AWS 명령이 실패했습니다.")
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profile", required=True, help="개인 AWS CLI profile")
    parser.add_argument("--expected-account-id", required=True, help="확인한 개인 AWS 계정의 12자리 ID")
    parser.add_argument("--region", default="us-east-1", help="Terraform state 버킷 리전")
    args = parser.parse_args()

    if not re.fullmatch(r"[0-9]{12}", args.expected_account_id):
        parser.error("--expected-account-id는 12자리 숫자여야 합니다.")

    try:
        identity = json.loads(required_aws(args.profile, args.region, "sts", "get-caller-identity").stdout)
        actual_account = identity["Account"]
        if actual_account != args.expected_account_id:
            print(
                f"계정 불일치: 예상 {args.expected_account_id}, 현재 {actual_account}. 아무 리소스도 만들지 않았습니다.",
                file=sys.stderr,
            )
            return 1

        bucket = f"globalization-demo-terraform-{actual_account}-{args.region}"
        head = aws(
            args.profile, args.region, "s3api", "head-bucket",
            "--bucket", bucket, "--expected-bucket-owner", actual_account,
        )
        if head.returncode != 0:
            if "404" not in head.stderr and "NoSuchBucket" not in head.stderr:
                raise RuntimeError(head.stderr.strip() or "S3 버킷 확인에 실패했습니다.")
            create_args = ["s3api", "create-bucket", "--bucket", bucket]
            if args.region != "us-east-1":
                create_args += [
                    "--create-bucket-configuration",
                    json.dumps({"LocationConstraint": args.region}),
                ]
            required_aws(args.profile, args.region, *create_args)

        required_aws(
            args.profile, args.region, "s3api", "put-public-access-block",
            "--bucket", bucket,
            "--public-access-block-configuration",
            "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true",
        )
        required_aws(
            args.profile, args.region, "s3api", "put-bucket-encryption",
            "--bucket", bucket,
            "--server-side-encryption-configuration",
            json.dumps({"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}),
        )
        required_aws(
            args.profile, args.region, "s3api", "put-bucket-versioning",
            "--bucket", bucket, "--versioning-configuration", "Status=Enabled",
        )
    except (RuntimeError, KeyError, json.JSONDecodeError) as error:
        print(f"개인 AWS backend 준비 실패: {error}", file=sys.stderr)
        return 1

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document = (
        f"bucket       = {json.dumps(bucket)}\n"
        'key          = "globalization-demo/terraform.tfstate"\n'
        f"region       = {json.dumps(args.region)}\n"
        "encrypt      = true\n"
        "use_lockfile = true\n"
    )
    fd, temporary_name = tempfile.mkstemp(prefix="personal-backend-", dir=OUTPUT.parent)
    temporary = Path(temporary_name)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            file.write(document)
        temporary.replace(OUTPUT)
    finally:
        temporary.unlink(missing_ok=True)

    print(f"개인 AWS 계정 {actual_account}의 state 버킷 준비 완료: {bucket}")
    print(f"Backend 설정: {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
