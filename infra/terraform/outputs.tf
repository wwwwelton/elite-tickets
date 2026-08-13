output "alb_dns_name" {
  description = "Public URL of the deployed app. Web is served at '/', the API at '/api/v1'."
  value       = "http://${aws_lb.this.dns_name}"
}

output "ecr_api_repository_url" {
  description = "Push apps/api images here before the first apply's tag exists."
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_web_repository_url" {
  description = "Push apps/web images here before the first apply's tag exists."
  value       = aws_ecr_repository.web.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.this.name
}

output "db_endpoint" {
  description = "RDS PostgreSQL endpoint (private; reachable only from API-family ECS tasks)."
  value       = aws_db_instance.this.address
  sensitive   = true
}

output "migrate_task_definition_arn" {
  description = "Run once after each deploy that changes the schema: aws ecs run-task ... (see infra/terraform/README.md)."
  value       = aws_ecs_task_definition.migrate.arn
}

output "seed_task_definition_arn" {
  description = "Run once to populate demo data, mirrors the compose `seed` service."
  value       = aws_ecs_task_definition.seed.arn
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "api_security_group_id" {
  description = "Security group shared by the api/migrate/seed/expiry tasks — needed for the run-task commands in the README."
  value       = aws_security_group.api.id
}
