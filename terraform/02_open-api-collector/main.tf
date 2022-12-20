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
      Product     = "open-api-schema-collector",
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

module "open_api_collector" {
  source = "../modules/ecs-service"

  name             = "open-api-schema-collector"
  short_name       = "oas-collector"
  ressource_prefix = "oas-collector-"

  base_domain = "aws.reiningapps.de"
  host        = "open-api-collector.aws.reiningapps.de"

  container_image_tag = "9"
  container_port      = 3000
}


resource "aws_iam_role_policy" "aws_access" {
  name = "oas-collector-open-api-schema-collector"
  role = module.open_api_collector.ecs_task_role.name

  // TODO More granular permissions
  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "ecs:*"
        ],
        "Effect": "Allow",
        "Resource": ["*"]
      }
    ]
  }
  EOF
}