#!/usr/bin/env python3
"""Deploy only the two personal-account Amplify demo apps from a checked plan.

Run this in a local terminal. The GitHub classic PAT is entered without echo,
never passed as a command argument, and never written to this repository.
Terraform's temporary plan and remote state can contain the PAT, so the plan
is kept in a private temporary directory and the S3 backend is encrypted.
"""

import getpass
import json
import os
import ssl
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib import error, request

from prepare_aws_ca_bundle import OUTPUT as CA_BUNDLE, main as prepare_ca_bundle


ROOT = Path(__file__).resolve().parents[1]
TERRAFORM = ROOT / "terraform"
ACCOUNT_ID = "866222014403"
REPOSITORY = "https://github.com/sooster910/globalization-white-label-demo"
EXPECTED_ACTIONS = {
    f'aws_amplify_app.demo["{deployment}"]': ["create"]
    for deployment in ("everex_us", "xenco_sg")
}
EXPECTED_ACTIONS.update({
    f'aws_amplify_branch.demo["{deployment}"]': ["create"]
    for deployment in ("everex_us", "xenco_sg")
})


def run(command, environment, *, capture=False):
    return subprocess.run(
        command,
        cwd=TERRAFORM,
        env=environment,
        check=True,
        text=True,
        capture_output=capture,
    )


def verify_github_token(token):
    github_request = request.Request(
        "https://api.github.com/user",
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "User-Agent": "globalization-white-label-demo",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    try:
        context = ssl.create_default_context(cafile=str(CA_BUNDLE))
        with request.urlopen(github_request, context=context, timeout=20) as response:
            user = json.load(response)
            scopes = {
                scope.strip()
                for scope in response.headers.get("X-OAuth-Scopes", "").split(",")
                if scope.strip()
            }
    except error.HTTPError as failure:
        if failure.code == 401:
            raise ValueError("GitHub가 PAT를 401 Bad credentials로 거절했습니다. 새로 발급한 토큰을 다시 복사해 주세요.") from None
        raise ValueError(f"GitHub PAT 확인 실패 (HTTP {failure.code}).") from None
    except (error.URLError, ssl.SSLError) as failure:
        raise ValueError(f"GitHub API 연결 실패: {failure.reason if isinstance(failure, error.URLError) else failure}") from None

    if user.get("login") != "sooster910":
        raise ValueError("PAT의 GitHub 계정이 sooster910이 아닙니다.")
    if scopes and not scopes.intersection({"admin:repo_hook", "repo"}):
        raise ValueError("PAT에 admin:repo_hook 또는 이를 포함하는 repo 권한이 없습니다.")
    print("GitHub PAT 인증 확인 완료: sooster910 (토큰 값은 출력하지 않음).", flush=True)


def main():
    backend = TERRAFORM / "backends" / "personal.s3.tfbackend"
    rtm_variables = TERRAFORM / "rtm.auto.tfvars.json"
    if not backend.is_file() or not rtm_variables.is_file():
        print("개인 backend 또는 RTM 공개 환경변수 파일이 없습니다.", file=sys.stderr)
        return 1

    try:
        rtm = json.loads(rtm_variables.read_text(encoding="utf-8"))
        source_variables = rtm["rtm_environment_variables"]
        if set(source_variables) != {"VITE_HOST_URL"} or not source_variables["VITE_HOST_URL"].startswith("https://"):
            raise ValueError("RTM 공개 환경변수 파일에는 HTTPS VITE_HOST_URL 한 개만 있어야 합니다.")
    except (OSError, ValueError, KeyError, TypeError) as error:
        print(f"RTM 변수 파일 확인 실패: {error}", file=sys.stderr)
        return 1

    if prepare_ca_bundle() != 0:
        return 1

    environment = os.environ.copy()
    for name in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN", "AWS_SHARED_CREDENTIALS_FILE"):
        environment.pop(name, None)
    environment.update({
        "AWS_PROFILE": "personal",
        "AWS_CA_BUNDLE": str(CA_BUNDLE),
        "TF_VAR_target_account_id": ACCOUNT_ID,
        "TF_INPUT": "0",
    })

    try:
        identity = json.loads(run(
            ["aws", "sts", "get-caller-identity", "--profile", "personal", "--output", "json"],
            environment,
            capture=True,
        ).stdout)
        if identity["Account"] != ACCOUNT_ID:
            raise ValueError("AWS 개인 계정 ID가 예상값과 다릅니다.")

        run(["terraform", "init", "-reconfigure", "-input=false", "-backend-config=backends/personal.s3.tfbackend"], environment)
        run(["terraform", "validate", "-no-color"], environment)

        token = getpass.getpass("GitHub classic PAT (admin:repo_hook): ").strip()
        if not token.startswith("ghp_"):
            raise ValueError("GitHub classic PAT(ghp_...)을 입력해 주세요.")
        verify_github_token(token)
        environment["TF_VAR_github_access_token"] = token
        del token

        with tempfile.TemporaryDirectory(prefix="globalization-demo-plan-") as directory:
            plan_path = str(Path(directory) / "personal.tfplan")
            run(["terraform", "plan", "-input=false", "-no-color", f"-out={plan_path}"], environment)
            plan = json.loads(run(["terraform", "show", "-json", plan_path], environment, capture=True).stdout)
            actions = {
                change["address"]: change["change"]["actions"]
                for change in plan.get("resource_changes", [])
                if change["change"]["actions"] != ["no-op"]
            }
            if actions != EXPECTED_ACTIONS:
                raise ValueError(f"예상과 다른 Terraform 변경이 있어 적용을 중단했습니다: {actions}")
            for change in plan["resource_changes"]:
                after = change["change"].get("after") or {}
                if change["type"] == "aws_amplify_app" and after.get("repository") != REPOSITORY:
                    raise ValueError("계획의 GitHub 저장소가 개인 저장소와 다릅니다.")
                if change["type"] == "aws_amplify_branch" and after.get("branch_name") != "main":
                    raise ValueError("계획의 GitHub 브랜치가 main과 다릅니다.")

            print("검사 통과: 개인 계정에 Amplify 앱 2개와 main 브랜치 2개만 생성합니다.", flush=True)
            run(["terraform", "apply", "-input=false", "-no-color", plan_path], environment)

        print("배포 URL:", flush=True)
        run(["terraform", "output", "demo_urls"], environment)
    except (subprocess.CalledProcessError, ValueError, KeyError, json.JSONDecodeError) as error:
        if isinstance(error, subprocess.CalledProcessError):
            print(f"배포 단계 실패: 명령 종료 코드 {error.returncode}", file=sys.stderr)
        else:
            print(f"배포 중단: {error}", file=sys.stderr)
        return 1
    finally:
        environment.pop("TF_VAR_github_access_token", None)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
