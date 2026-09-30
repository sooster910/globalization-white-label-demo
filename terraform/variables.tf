variable "aws_region" {
  description = "새 Amplify 앱을 생성할 AWS 리전"
  type        = string
  default     = "us-east-1"
}

variable "target_account_id" {
  description = "Amplify 앱을 생성할 AWS 계정 ID. 현재 자격 증명과 다르면 계획/적용을 차단한다."
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.target_account_id))
    error_message = "target_account_id는 12자리 AWS 계정 ID여야 합니다."
  }
}

variable "app_name" {
  description = "데모용 Amplify 앱 이름 접두어"
  type        = string
  default     = "globalization-white-label-demo"
}

variable "repository_url" {
  description = "두 Amplify 앱이 공통으로 빌드할 Git repository URL"
  type        = string
  default     = "https://github.com/sooster910/globalization-white-label-demo"
}

variable "repository_branch" {
  description = "두 Amplify 앱이 공통으로 빌드할 Git branch"
  type        = string
  default     = "main"
}

variable "github_access_token" {
  description = "Amplify가 repository를 연결할 때 사용하는 GitHub access token"
  type        = string
  sensitive   = true
}

variable "app_root" {
  description = "Repository root 기준 Vite 프로젝트 경로"
  type        = string
  default     = "."
}

variable "deployments" {
  description = "같은 코드/브랜치에서 배포별로 주입할 네 가지 공개 Vite 설정"
  type = map(object({
    brand_id       = string
    api_base_url   = optional(string)
    country_code   = string
    default_locale = string
  }))

  # API URL을 지정하지 않으면 동기화한 RTM VITE_HOST_URL을 사용한다.
  # SG 전용 API가 준비되면 xenco_sg.api_base_url을 명시적으로 지정한다.
  default = {
    everex_us = {
      brand_id       = "everex"
      country_code   = "US"
      default_locale = "en-US"
    }
    xenco_sg = {
      brand_id       = "xenco"
      country_code   = "SG"
      default_locale = "en-SG"
    }
  }

  validation {
    condition = alltrue([
      for item in values(var.deployments) :
      contains(["everex", "xenco"], item.brand_id) &&
      contains(["US", "SG"], item.country_code) &&
      contains(["en-US", "en-SG"], item.default_locale) &&
      (item.api_base_url == null ? true : startswith(item.api_base_url, "https://"))
    ])
    error_message = "brand_id, country_code, default_locale 또는 HTTPS API URL이 지원 범위를 벗어났습니다."
  }
}

variable "rtm_environment_variables" {
  description = "RTM Amplify 앱과 브랜치에서 가져온 유효 환경변수. sync_rtm_env.py가 생성하는 로컬 tfvars로 주입한다."
  type        = map(string)
  sensitive   = true
  nullable    = false

  validation {
    condition     = length(var.rtm_environment_variables) > 0
    error_message = "RTM 환경변수를 먼저 동기화해야 합니다. scripts/sync_rtm_env.py를 실행하세요."
  }
}
