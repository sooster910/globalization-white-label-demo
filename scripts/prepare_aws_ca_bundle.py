#!/usr/bin/env python3
"""Combine macOS system CAs with the trusted Zscaler CA for AWS CLI TLS."""

import os
import subprocess
import sys
import tempfile
from pathlib import Path


SYSTEM_CA = Path("/etc/ssl/cert.pem")
OUTPUT = Path(tempfile.gettempdir()) / "globalization-demo-aws-ca-bundle.pem"


def main() -> int:
    if sys.platform != "darwin":
        print("이 스크립트는 macOS Keychain 전용입니다.", file=sys.stderr)
        return 1

    result = subprocess.run(
        ["security", "find-certificate", "-a", "-c", "Zscaler", "-p"],
        capture_output=True,
        check=False,
    )
    if result.returncode != 0 or b"-----BEGIN CERTIFICATE-----" not in result.stdout:
        print("Keychain에서 신뢰된 Zscaler CA를 찾지 못했습니다.", file=sys.stderr)
        return 1

    try:
        bundle = SYSTEM_CA.read_bytes() + b"\n" + result.stdout
        fd, temporary_name = tempfile.mkstemp(prefix="globalization-aws-ca-", dir=OUTPUT.parent)
        temporary = Path(temporary_name)
        try:
            os.fchmod(fd, 0o600)
            with os.fdopen(fd, "wb") as file:
                file.write(bundle)
            temporary.replace(OUTPUT)
        finally:
            temporary.unlink(missing_ok=True)
    except OSError as error:
        print(f"AWS CA 묶음 생성 실패: {error}", file=sys.stderr)
        return 1

    print(f"AWS CA 묶음 준비 완료: {OUTPUT}")
    print(f"export AWS_CA_BUNDLE={OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
