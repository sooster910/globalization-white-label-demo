locals {
  build_spec = <<-YAML
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - nvm install 22.18.0
            - nvm use 22.18.0
            - npm install -g pnpm@10.33.2
            - cd ${var.app_root} && pnpm install --frozen-lockfile
        build:
          commands:
            - cd ${var.app_root} && pnpm build
      artifacts:
        baseDirectory: ${var.app_root}/dist
        files:
          - '**/*'
      cache:
        paths:
          - ${var.app_root}/node_modules/**/*
  YAML
}

# 하나의 repository / branch / commit을 각 Amplify 앱에서 별도로 빌드한다.
# 기존 RTM 환경변수를 복사하고, 설계 문서의 네 VITE_* 값만 배포별로 덮어쓴다.
resource "aws_amplify_app" "demo" {
  for_each = var.deployments

  name         = "${var.app_name}-${replace(each.key, "_", "-")}"
  description  = "Globalization and white label demo: ${each.key}"
  platform     = "WEB"
  repository   = var.repository_url
  access_token = var.github_access_token
  build_spec   = local.build_spec

  environment_variables = merge(var.rtm_environment_variables, {
    VITE_BRAND_ID            = each.value.brand_id
    VITE_API_BASE_URL        = coalesce(each.value.api_base_url, lookup(var.rtm_environment_variables, "VITE_HOST_URL", null))
    VITE_MARKET_COUNTRY_CODE = each.value.country_code
    VITE_DEFAULT_LOCALE      = each.value.default_locale
  })

  tags = {
    Project    = "globalization-white-label-demo"
    Deployment = each.key
    Purpose    = "demo"
  }
}

resource "aws_amplify_branch" "demo" {
  for_each = aws_amplify_app.demo

  app_id            = each.value.id
  branch_name       = var.repository_branch
  stage             = "EXPERIMENTAL"
  framework         = "React"
  enable_auto_build = true
}
