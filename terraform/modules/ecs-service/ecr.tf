resource "aws_kms_key" "repo" {
  description         = "${local.name} ECR Repo Key"
  enable_key_rotation = true
}

# tfsec:ignore:AWS093:exp:2021-10-01
resource "aws_ecr_repository" "service" {
  name                 = local.name
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = aws_kms_key.repo.arn
  }
}
