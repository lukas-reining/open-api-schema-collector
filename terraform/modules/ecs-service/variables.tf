variable "region" {
  description = "The aws region to use"
  type        = string
  default     = "eu-central-1"
}

variable "name" {
  description = "Name of the service"
  type        = string
}

variable "short_name" {
  description = "Short name of the service"
  type        = string
}

variable "ressource_prefix" {
  description = "Prefix for all ressources of the service"
  type        = string
}

variable "container_image_tag" {
  description = "Image tag of the container"
  type        = string
}

variable "container_port" {
  description = "Container port for services"
  type        = number
}

variable "base_domain" {
  description = "DNS base domain"
  type        = string
}

variable "host" {
  description = "DNS hostname for this service"
  type        = string
  default     = ""
}

variable "api_task_tags" {
  description = "Tags for the ECS service task"
  default     = {}
}

variable "tags" {
  description = "Additional default tags for all aws resources"
  default     = {}
}