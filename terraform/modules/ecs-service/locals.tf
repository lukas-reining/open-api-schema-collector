locals {
  name           = var.name
  short_name     = var.short_name
  prefix         = var.ressource_prefix

  lb_arn                = data.terraform_remote_state.project.outputs.main_tls_lb
  lb_http_listener_arn  = data.terraform_remote_state.project.outputs.main_http_lb_listener
  lb_https_listener_arn = data.terraform_remote_state.project.outputs.main_https_lb_listener
  subnet_ids            = data.terraform_remote_state.project.outputs.private_subnet_ids
  ecs_cluster_id        = data.terraform_remote_state.project.outputs.ecs_cluster_id
  repository_url        = data.terraform_remote_state.project.outputs.repository_url
}
