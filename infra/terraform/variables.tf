variable "aws_region" {
  description = "AWS region to deploy into. sa-east-1 (São Paulo) is the only AWS South America region."
  type        = string
  default     = "sa-east-1"
}

variable "availability_zones" {
  description = "Availability zones used for the public/private subnets."
  type        = list(string)
  default     = ["sa-east-1a", "sa-east-1b"]
}

variable "project_name" {
  description = "Short name used to prefix and tag every resource."
  type        = string
  default     = "elite-tickets"
}

variable "environment" {
  description = "Deployment environment name, used for tagging."
  type        = string
  default     = "production"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.20.0.0/16"
}

# --- Container images -------------------------------------------------------
# Built and pushed to the ECR repositories this module creates (see
# infra/terraform/README.md for the build/push commands). Terraform does not
# build images itself.

variable "api_image_tag" {
  description = "Tag of the apps/api image to deploy (built from apps/api/Dockerfile)."
  type        = string
  default     = "latest"
}

variable "web_image_tag" {
  description = "Tag of the apps/web image to deploy (built from apps/web/Dockerfile)."
  type        = string
  default     = "latest"
}

# --- Sizing ------------------------------------------------------------------

variable "api_cpu" {
  description = "Fargate CPU units for the API task (256 = .25 vCPU)."
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Fargate memory (MiB) for the API task."
  type        = number
  default     = 1024
}

variable "web_cpu" {
  description = "Fargate CPU units for the web task."
  type        = number
  default     = 256
}

variable "web_memory" {
  description = "Fargate memory (MiB) for the web task."
  type        = number
  default     = 512
}

variable "api_desired_count" {
  description = "Number of API tasks to run."
  type        = number
  default     = 1
}

variable "web_desired_count" {
  description = "Number of web tasks to run."
  type        = number
  default     = 1
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GiB."
  type        = number
  default     = 20
}

# --- Application configuration -----------------------------------------------
# Mirrors the variables in .env.example / compose.yaml.

variable "db_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "elite_tickets"
}

variable "db_username" {
  description = "PostgreSQL master username."
  type        = string
  default     = "elite_tickets"
}

variable "db_password" {
  description = "PostgreSQL master password. Supply via terraform.tfvars (untracked) or TF_VAR_db_password; never commit it."
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret (>= 32 bytes, must differ from qr_secret)."
  type        = string
  sensitive   = true
}

variable "qr_secret" {
  description = "QR credential signing secret (>= 32 bytes, must differ from jwt_secret)."
  type        = string
  sensitive   = true
}

variable "ticketmaster_api_key" {
  description = "Ticketmaster Discovery API key used by the organizer catalog search and demo seed."
  type        = string
  sensitive   = true
}

variable "cors_origins" {
  description = "Comma-separated browser origins allowed to call the API. Set to the deployed web origin(s) in production."
  type        = string
  default     = ""
}
