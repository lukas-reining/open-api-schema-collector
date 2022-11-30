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
  region = "eu-central-1"
  default_tags {
    tags = merge({
      Iac         = "true",
      Product     = "example-api",
      Environment = "production"
      Shared      = "false"
    })
  }
}

data "terraform_remote_state" "project" {
  backend = "s3"

  config = {
    region = "eu-central-1"
    bucket = "terraform-playground-cc"
    key    = "states/aws-ecs-test/base/tfstate"
  }
}

module "example_api" {
  source = "../modules/ecs-service"

  name             = "example-api"
  short_name       = "example-api"
  ressource_prefix = "example-api-"

  base_domain = "aws.reiningapps.de"
  host        = "api1.aws.reiningapps.de"

  api_task_tags = {
    OpenApiSchemaAvailable = "true"
    OpenApiSchemaProtocol  = "http"
    OpenApiSchemaPort      = "3000"
    OpenApiSchemaPath      = "/api-docs-json"
  }

  container_image_tag = "7"
  container_port      = 3000
}