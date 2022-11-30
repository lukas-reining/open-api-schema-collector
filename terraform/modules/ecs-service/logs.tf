
resource "aws_cloudwatch_log_group" "service" {
  name       = "${local.prefix}${local.name}"
  kms_key_id = aws_kms_key.log.arn
}

data "aws_caller_identity" "current" {}

resource "aws_kms_key" "log" {
  description             = "Service Cloud Watch Log (${local.name})"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  policy = <<EOF
{
  "Version" : "2012-10-17",
  "Statement" : [ {
      "Sid" : "Enable IAM User Permissions",
      "Effect" : "Allow",
      "Principal" : {
        "AWS" : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      },
      "Action" : "kms:*",
      "Resource" : "*"
    },
    {
      "Effect": "Allow",
      "Principal": { "Service": "logs.${var.region}.amazonaws.com" },
      "Action": [
        "kms:Encrypt*",
        "kms:Decrypt*",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:Describe*"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}