# Mirrors the secrets passed as plain env vars in compose.yaml / .env.example,
# but stored in Secrets Manager and injected into the ECS tasks via the
# `secrets` block (never baked into the task definition or image).

locals {
  database_url = "postgresql+psycopg://${var.db_username}:${var.db_password}@${aws_db_instance.this.address}:5432/${var.db_name}"
}

resource "aws_secretsmanager_secret" "database_url" {
  name = "${local.name}/database-url"
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = local.database_url
}

resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "${local.name}/jwt-secret"
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

resource "aws_secretsmanager_secret" "qr_secret" {
  name = "${local.name}/qr-secret"
}

resource "aws_secretsmanager_secret_version" "qr_secret" {
  secret_id     = aws_secretsmanager_secret.qr_secret.id
  secret_string = var.qr_secret
}

resource "aws_secretsmanager_secret" "ticketmaster_api_key" {
  name = "${local.name}/ticketmaster-api-key"
}

resource "aws_secretsmanager_secret_version" "ticketmaster_api_key" {
  secret_id     = aws_secretsmanager_secret.ticketmaster_api_key.id
  secret_string = var.ticketmaster_api_key
}
