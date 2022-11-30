terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
  backend "s3" {}
}

# Configure the AWS Provider
provider "aws" {
  region = var.region
  default_tags {
    tags = merge({
      Iac         = "true",
      Product     = "ecs-test",
      Environment = "production"
      Shared      = "false"
    }, var.tags)
  }
}