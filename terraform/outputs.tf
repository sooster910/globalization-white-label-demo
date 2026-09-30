output "app_ids" {
  value       = { for key, app in aws_amplify_app.demo : key => app.id }
  description = "배포별 Amplify 앱 ID"
}

output "demo_urls" {
  value = {
    for key, branch in aws_amplify_branch.demo :
    key => "https://${branch.branch_name}.${aws_amplify_app.demo[key].default_domain}"
  }
  description = "배포별 Amplify 기본 URL"
}
