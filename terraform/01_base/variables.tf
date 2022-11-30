variable "region" {
  description = "The aws region to use"
  type        = string
  default     = "eu-central-1"
}

variable "base_domain" {
  description = "DNS base domain"
  type        = string
  default     = "aws.reiningapps.de"
}

variable "tags" {
  description = "Additional default tags for all aws resources"
  default     = {}
}