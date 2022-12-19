output "main_tls_lb" {
  value = aws_lb.default.arn
}

output "main_http_lb_listener" {
  value = aws_lb_listener.http.arn
}

output "main_https_lb_listener" {
  value = aws_lb_listener.https.arn
}

output "public_subnet_ids" {
  value = [
    for subnet in aws_subnet.public : subnet.id
  ]
}

output "ecs_cluster_id" {
  value = aws_ecs_cluster.main.id
}

output "repository_url" {
  value = aws_ecr_repository.api.repository_url
}