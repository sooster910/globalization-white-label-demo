#!/usr/bin/env python3
"""Create a short-lived AWS CLI profile after prompting for a local MFA code.

The code and credentials are never printed. The session is stored outside this
repository in a separate 0600 credentials file under ~/.aws/.
"""

import argparse
import getpass
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path


SESSION_FILE = Path.home() / ".aws" / "globalization-demo-session"


def aws_json(*arguments):
    result = subprocess.run(
        ["aws", *arguments, "--output", "json"],
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(result.stdout)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-profile", default="default")
    parser.add_argument("--duration-seconds", type=int, default=3600)
    args = parser.parse_args()

    try:
        devices = aws_json(
            "iam", "list-mfa-devices", "--profile", args.source_profile
        )["MFADevices"]
        virtual = [
            device["SerialNumber"]
            for device in devices
            if ":mfa/" in device["SerialNumber"]
        ]
        if len(virtual) != 1:
            print("사용할 가상 MFA 장치를 하나로 특정할 수 없습니다.", file=sys.stderr)
            return 1
        serial = virtual[0]
        code = getpass.getpass("AWS MFA 코드: ").strip()
        if len(code) != 6 or not code.isdigit():
            print("6자리 MFA 코드를 입력해 주세요.", file=sys.stderr)
            return 1
        credentials = aws_json(
            "sts", "get-session-token",
            "--serial-number", serial,
            "--token-code", code,
            "--duration-seconds", str(args.duration_seconds),
            "--profile", args.source_profile,
        )["Credentials"]
    except (subprocess.CalledProcessError, KeyError, json.JSONDecodeError) as error:
        if isinstance(error, subprocess.CalledProcessError):
            print(error.stderr.strip() or "AWS MFA 세션 생성에 실패했습니다.", file=sys.stderr)
        else:
            print("AWS 응답을 읽지 못했습니다.", file=sys.stderr)
        return 1

    SESSION_FILE.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(prefix="globalization-demo-", dir=SESSION_FILE.parent)
    temporary = Path(temporary_name)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            file.write("[mfa]\n")
            file.write("aws_access_key_id = {}\n".format(credentials["AccessKeyId"]))
            file.write("aws_secret_access_key = {}\n".format(credentials["SecretAccessKey"]))
            file.write("aws_session_token = {}\n".format(credentials["SessionToken"]))
        temporary.replace(SESSION_FILE)
    finally:
        temporary.unlink(missing_ok=True)

    print("MFA 세션 준비 완료 (만료: {}).".format(credentials["Expiration"]))
    print("프로필: AWS_SHARED_CREDENTIALS_FILE={} AWS_PROFILE=mfa".format(SESSION_FILE))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
