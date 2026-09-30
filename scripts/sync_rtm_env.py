#!/usr/bin/env python3
"""Copy effective RTM Amplify variables into a gitignored Terraform var file.

The values are never printed. The app-level map is overlaid with branch values,
which matches Amplify's effective build environment for the selected branch.
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "terraform" / "rtm.auto.tfvars.json"


def aws_json(profile: Optional[str], region: str, *args: str) -> dict:
    command = ["aws", "amplify", *args, "--region", region, "--output", "json"]
    if profile:
        command.extend(["--profile", profile])
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    return json.loads(result.stdout)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-app-id", required=True, help="RTM Amplify app ID")
    parser.add_argument("--source-branch", required=True, help="RTM branch name (for example, dev)")
    parser.add_argument("--region", default="us-east-1")
    parser.add_argument("--profile", help="AWS CLI profile with MFA-authenticated access")
    parser.add_argument(
        "--demo-public-only", action="store_true",
        help="개인 데모용으로 VITE_HOST_URL만 복사하고 RTM 비밀값은 제외",
    )
    args = parser.parse_args()

    try:
        app = aws_json(args.profile, args.region, "get-app", "--app-id", args.source_app_id)["app"]
        branch = aws_json(
            args.profile, args.region, "get-branch", "--app-id", args.source_app_id,
            "--branch-name", args.source_branch,
        )["branch"]
    except (subprocess.CalledProcessError, KeyError, json.JSONDecodeError) as error:
        if isinstance(error, subprocess.CalledProcessError):
            print(error.stderr.strip() or "AWS Amplify 조회에 실패했습니다.", file=sys.stderr)
        else:
            print("AWS Amplify 응답을 읽지 못했습니다.", file=sys.stderr)
        return 1

    values = {**(app.get("environmentVariables") or {}), **(branch.get("environmentVariables") or {})}
    if args.demo_public_only:
        values = {key: value for key, value in values.items() if key == "VITE_HOST_URL"}
    if not values:
        print("복사할 RTM 환경변수가 없습니다. 파일을 생성하지 않았습니다.", file=sys.stderr)
        return 1

    # The RTM source region can differ from the destination account's region.
    document = {"rtm_environment_variables": values}
    fd, temporary_name = tempfile.mkstemp(prefix="rtm-env-", dir=OUTPUT.parent)
    temporary = Path(temporary_name)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            json.dump(document, file, ensure_ascii=False, indent=2)
            file.write("\n")
        temporary.replace(OUTPUT)
    finally:
        temporary.unlink(missing_ok=True)

    print(f"{OUTPUT} 생성 완료 ({len(values)}개 변수). 값은 출력하지 않았습니다.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
