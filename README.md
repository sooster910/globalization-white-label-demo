# Globalization & White Label Demo

Vite, pnpm, React, TypeScript로 만든 데모입니다. [RTM Brand, Market Deployment Configuration 설계](https://everexjj.atlassian.net/wiki/x/BQDNCQ)와 [ADR-001](https://everexjj.atlassian.net/wiki/x/rgDnCQ)의 **One Source + Environment-specific Build** 방향을 반영했습니다.

## 데모에서 확인할 것

- EverEx / Xenco 로고, 이름, 색상, 지원·법적 링크를 같은 화면에서 비교합니다. 화면의 브랜드 전환은 **미리보기**이며 배포 설정을 바꾸지 않습니다.
- `public/brands/`의 SVG 로고는 데모용 예시 에셋입니다.
- 기본 언어는 배포별 `VITE_DEFAULT_LOCALE`로 정하고, 화면에서는 언어별 번역과 `Intl` 날짜·숫자 표시를 살펴볼 수 있습니다.
- 시간대는 샘플 조직 정보, 통화 코드는 샘플 서버 데이터로 별도 선택합니다. 언어나 시장 코드에서 추론하지 않습니다.
- 배포 브랜드, API URL, 시장 국가, 기본 언어는 Terraform이 Amplify 빌드에 주입합니다. `src/deploymentConfig.ts`가 시작 시 검증합니다.
- 데모에는 실제 로그인, `/staff-me` 호출, 환자 API 연동이 없습니다. 화면 데이터는 모두 가상입니다.

## 로컬 실행

```bash
cd globalization-demo
pnpm install
pnpm dev
```

`.env.development`의 네 값은 로컬 개발용 공개 예시입니다. 프로덕션 빌드는 배포 설정을 명시해야 합니다.

```bash
VITE_BRAND_ID=everex \
VITE_API_BASE_URL=https://api.rtm.everex.com \
VITE_MARKET_COUNTRY_CODE=US \
VITE_DEFAULT_LOCALE=en-US \
pnpm build
```

## Amplify 운영

`terraform/`은 새 데모용 Amplify 앱 두 개(`everex_us`, `xenco_sg`)를 정의합니다. 두 앱은 같은 Git 저장소와 브랜치를 사용하지만 각자의 네 `VITE_*` 값으로 **각각 Vite 빌드**를 실행합니다. 기존 RTM 앱이나 도메인을 수정하지 않습니다.

### 개인 AWS + 개인 GitHub 계정

기본 Git 저장소는 [sooster910/globalization-white-label-demo](https://github.com/sooster910/globalization-white-label-demo)입니다. 개인 AWS CLI 프로필을 준비한 다음, **본인 계정 ID**를 확인합니다. 아래 준비 스크립트를 실행하면 개인 계정에 Terraform state 전용 S3 버킷이 생성됩니다. 버킷에는 공개 접근 차단, 서버 측 암호화, 버전 관리를 적용합니다. S3 보관량과 요청에 따른 비용이 발생할 수 있습니다.

계정 `866222014403`의 `terraform-demo` IAM 사용자로 실행할 때는 먼저 계정 관리자에게 [`terraform/personal-aws-iam-policy.json`](terraform/personal-aws-iam-policy.json)을 사용자 인라인 정책으로 추가해 달라고 요청해야 합니다. [AWS 콘솔](https://console.aws.amazon.com/iam/)에서 **사용자 → terraform-demo → 권한 → 권한 추가 → 인라인 정책 생성 → JSON** 순서로 이동해 파일 내용을 붙여 넣습니다. 이 정책은 이 데모의 state 버킷과 `us-east-1`의 Amplify 앱 관리에 필요한 권한을 담고 있습니다. 현재 사용자는 자신의 IAM 정책을 추가할 권한이 없습니다. 이미 생성된 빈 state 버킷은 준비 스크립트를 다시 실행하면 보호 설정을 이어서 적용합니다.

이 Mac처럼 회사 네트워크의 Zscaler 인증서를 사용하는 경우 AWS CLI의 S3 TLS 검증에 추가 CA 묶음이 필요합니다. `python3 scripts/prepare_aws_ca_bundle.py`가 macOS Keychain에 이미 신뢰된 공개 CA를 임시 파일에 합칩니다. 출력된 `export AWS_CA_BUNDLE=...` 명령을 **같은 터미널**에서 실행한 다음 AWS CLI와 Terraform을 실행합니다.

```bash
aws sts get-caller-identity --profile personal --query '{Account:Account,Arn:Arn}'
python3 scripts/prepare_personal_backend.py \
  --profile personal \
  --expected-account-id <PERSONAL_AWS_ACCOUNT_ID>
```

RTM Amplify 앱에서 환경변수를 가져올 때는 **RTM을 읽을 수 있는 별도 AWS 프로필**을 사용합니다. `--demo-public-only`는 데모에 필요한 공개 `VITE_HOST_URL`만 복사하므로 RTM 비밀값을 개인 계정에 옮기지 않습니다. 원본 앱/브랜치 값은 로컬 `terraform/rtm.auto.tfvars.json`에 저장되고 Git에서 제외됩니다. 기존 IAM 사용자는 MFA 세션이 필요할 수 있습니다.

```bash
python3 scripts/aws_mfa_session.py
export AWS_SHARED_CREDENTIALS_FILE="$HOME/.aws/globalization-demo-session"
python3 scripts/sync_rtm_env.py \
  --source-app-id <RTM_APP_ID> \
  --source-branch <RTM_BRANCH> \
  --profile mfa \
  --demo-public-only
unset AWS_SHARED_CREDENTIALS_FILE
```

개인 AWS 프로필과 계정 ID를 지정하고, 개인용 backend로 초기화합니다. `target_account_id`와 실제 AWS 자격 증명의 계정이 다르면 Terraform AWS provider가 배포를 막습니다. 먼저 `sooster910` 계정에 [해당 리전의 Amplify GitHub App](https://github.com/apps/aws-amplify-us-east-1/installations/new)을 **이 데모 저장소를 포함하도록** 설치하고, [AWS 안내](https://docs.aws.amazon.com/amplify/latest/userguide/setting-up-GitHub-access.html)에 따라 GitHub **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token**에서 `admin:repo_hook` 권한의 연결용 토큰을 준비합니다. GitHub CLI의 로그인 토큰은 이 권한을 보장하지 않습니다.

최초 개인 계정 배포는 `python3 scripts/deploy_personal.py`로 실행합니다. 스크립트가 토큰을 터미널에서 숨김 입력으로 받고, GitHub API에서 토큰과 `sooster910` 계정을 확인합니다. 이어서 AWS 계정과 Terraform 변경 내역을 검사한 뒤 예상한 Amplify 앱 2개와 브랜치 2개만 적용합니다. 이 스크립트는 **최초 생성 계획만** 적용하므로 이미 배포된 앱에는 다시 실행하지 않습니다. 토큰은 채팅이나 Git 저장소 파일에 넣지 않습니다. Terraform 임시 plan과 암호화된 S3 state에는 민감한 값이 들어갈 수 있습니다. `401 Bad credentials`가 나오면 [GitHub classic PAT 화면](https://github.com/settings/tokens)에서 새 토큰을 복사해 다시 실행합니다.

```bash
python3 scripts/deploy_personal.py
```

아래는 동일한 Terraform 명령을 수동으로 실행할 때의 예시입니다. 수동 실행에서는 토큰이 셸 환경에 남으므로 작업 후 `unset TF_VAR_github_access_token`을 실행합니다.

```zsh
cd terraform
export AWS_PROFILE=personal
export TF_VAR_target_account_id=<PERSONAL_AWS_ACCOUNT_ID>
read -rs "TF_VAR_github_access_token?Amplify GitHub PAT: "
echo
export TF_VAR_github_access_token
terraform init -reconfigure -backend-config=backends/personal.s3.tfbackend
terraform validate
terraform plan
terraform apply
terraform output demo_urls
unset TF_VAR_github_access_token
```

`globalization-demo/` 폴더 자체가 Git 저장소 루트이므로 `app_root` 기본값은 `.`입니다. API URL을 별도로 지정하지 않으면 RTM에서 복사한 `VITE_HOST_URL`을 두 배포에 사용합니다. Xenco SG 전용 백엔드가 준비되면 `deployments.xenco_sg.api_base_url`을 지정해야 합니다. 현재 데모 화면은 API를 호출하지 않습니다. RTM 환경변수 전체를 넘기면 `SENTRY_AUTH_TOKEN` 등 비밀값도 Terraform state와 Amplify에 저장됩니다. `VITE_*` 값은 Vite 번들에 공개되므로 비밀값을 넣으면 안 됩니다.

### 실제 데모 주소와 코드 배포

| 배포 | 주소 | Amplify 앱 ID |
| --- | --- | --- |
| EverEx US | https://main.d3aatlp1imw7oq.amplifyapp.com | `d3aatlp1imw7oq` |
| Xenco SG | https://main.d3tcxkitlnwfsa.amplifyapp.com | `d3tcxkitlnwfsa` |

두 앱은 개인 저장소의 `main` 브랜치를 연결했고 자동 빌드를 켰습니다. 앱 코드 변경은 이 브랜치로 푸시하면 각각 새 빌드로 배포됩니다. 인프라 설정을 바꿀 때는 `terraform/`에서 개인 AWS 프로필과 GitHub PAT를 준비한 뒤 `terraform plan`을 검토하고 `terraform apply`를 실행합니다. Amplify 빌드·배포·데이터 전송과 S3 state 저장에는 개인 계정 비용이 발생할 수 있습니다.

## 현재 확인 상태

- `pnpm build`, `pnpm lint`, `terraform validate` 통과
- 계정 `866222014403`의 state 버킷에 공개 접근 차단·암호화·버전 관리를 적용했고, 개인 S3 backend로 `terraform init`을 완료했습니다.
- `sooster910/globalization-white-label-demo` 저장소가 `AWS Amplify (us-east-1)` GitHub App의 선택 저장소에 포함된 것을 확인했습니다.
- `FE-EverExRTM`의 `develop` 브랜치에서 공개 `VITE_HOST_URL`만 로컬 Git 제외 변수 파일에 동기화했습니다.
- 개인 AWS 계정에 Terraform으로 Amplify 앱 2개와 각 `main` 브랜치를 생성했습니다. 첫 RELEASE 작업의 BUILD·DEPLOY·VERIFY가 두 앱 모두 성공했고 위 URL은 HTTP 200 및 실제 화면 렌더링을 확인했습니다.
- 두 앱의 Amplify 환경변수는 공개 `VITE_*` 5개뿐이며, `VITE_HOST_URL`과 `VITE_API_BASE_URL`은 RTM `develop` 값과 일치합니다.
