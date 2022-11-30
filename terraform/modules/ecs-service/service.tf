data "aws_vpc" "main" {
  id = data.aws_lb.main.vpc_id
}

data "aws_lb" "main" {
  arn = local.lb_arn
}

data "aws_lb_listener" "http" {
  arn = local.lb_http_listener_arn
}

data "aws_lb_listener" "https" {
  arn = local.lb_https_listener_arn
}

data "aws_iam_policy_document" "ecs_task_execution_role" {
  version = "2012-10-17"
  statement {
    sid     = ""
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Should every service have its own iam role?
resource "aws_iam_role" "ecs_task_execution_role" {
  name               = "${local.prefix}${local.name}-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_role.json
}

resource "aws_iam_role" "ecs_task_role" {
  name               = "${local.prefix}${local.name}-ecs-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_role.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_lb_target_group" "service" {
  name                 = "${local.prefix}${local.short_name}-tg"
  port                 = 80
  protocol             = "HTTP"
  vpc_id               = data.aws_lb.main.vpc_id
  target_type          = "ip"
  deregistration_delay = 10

  health_check {
    healthy_threshold   = "3"
    interval            = "90"
    protocol            = "HTTP"
    matcher             = "200-299"
    timeout             = "20"
    path                = "/"
    unhealthy_threshold = "2"
  }
}

resource "aws_lb_listener_rule" "service" {
  listener_arn = data.aws_lb_listener.https.arn

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.service.arn
  }

  condition {
    host_header {
      values = [var.host]
    }
  }
}

resource "aws_security_group" "api_service" {
  name   = "${local.prefix}${local.name}-task-security-group"
  vpc_id = data.aws_lb.main.vpc_id

  ingress {
    protocol        = "tcp"
    from_port       = var.container_port
    to_port         = var.container_port
    security_groups = data.aws_lb.main.security_groups
  }

  ingress {
    protocol    = "tcp"
    from_port   = var.container_port
    to_port     = var.container_port
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  egress {
    protocol    = "-1"
    from_port   = 0
    to_port     = 0
    cidr_blocks = ["0.0.0.0/0"]
  }
}


resource "aws_ecs_service" "api_service" {
  name            = "${local.prefix}${local.name}"
  cluster         = local.ecs_cluster_id
  task_definition = aws_ecs_task_definition.api_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"
  propagate_tags  = "TASK_DEFINITION"

  network_configuration {
    security_groups  = [aws_security_group.api_service.id]
    subnets          = local.subnet_ids
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.service.id
    container_name   = local.name
    container_port   = var.container_port
  }
}

resource "aws_ecs_task_definition" "api_service" {
  family                   = local.name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  cpu                      = 256
  memory                   = 512
  tags                     = var.api_task_tags

  container_definitions = jsonencode([
    {
      name      = local.name
      image     = "${aws_ecr_repository.service.repository_url}:${var.container_image_tag}"
      cpu       = 256
      memory    = 512
      essential = true

      logConfiguration = {
        logDriver = "awslogs",

        options = {
          "awslogs-region"        = var.region,
          "awslogs-stream-prefix" = "${local.prefix}${local.name}",
          "awslogs-group"         = aws_cloudwatch_log_group.service.name
        }
      }

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
        }
      ]
    }
  ])
}

