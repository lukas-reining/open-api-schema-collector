data "aws_route53_zone" "primary" {
  name = var.base_domain
}

resource "aws_acm_certificate" "base_cert" {
  domain_name       = data.aws_route53_zone.primary.name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "certificate_validation" {
  for_each = {
    for dvo in aws_acm_certificate.base_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  zone_id         = data.aws_route53_zone.primary.zone_id
  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  type            = each.value.type
  ttl             = 60
}

resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.base_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.certificate_validation : record.fqdn]
}
