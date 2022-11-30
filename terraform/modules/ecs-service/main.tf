terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
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