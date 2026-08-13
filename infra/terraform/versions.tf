terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local state by default. Point this at an S3 backend (with a DynamoDB lock
  # table) before running this against a real team environment:
  #
  # backend "s3" {
  #   bucket         = "elite-tickets-tfstate"
  #   key            = "aws-sa/terraform.tfstate"
  #   region         = "sa-east-1"
  #   dynamodb_table = "elite-tickets-tfstate-lock"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
