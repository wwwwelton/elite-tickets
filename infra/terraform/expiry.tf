# Runs the expiry sweep once a minute, the same cadence as infra/render.yaml's
# cron service and the `expiry` loop in compose.yaml — but as a scheduled
# one-off Fargate task instead of a long-lived container.

resource "aws_iam_role" "events_ecs" {
  name = "${local.name}-events-run-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "events_ecs_run_task" {
  name = "${local.name}-events-run-task"
  role = aws_iam_role.events_ecs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ecs:RunTask"]
        Resource = [replace(aws_ecs_task_definition.expiry.arn, "/:\\d+$/", ":*")]
        Condition = {
          ArnLike = { "ecs:cluster" = aws_ecs_cluster.this.arn }
        }
      },
      {
        Effect   = "Allow"
        Action   = ["iam:PassRole"]
        Resource = [aws_iam_role.execution.arn]
      }
    ]
  })
}

resource "aws_cloudwatch_event_rule" "expiry" {
  name                = "${local.name}-expiry-every-minute"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "expiry" {
  rule     = aws_cloudwatch_event_rule.expiry.name
  arn      = aws_ecs_cluster.this.arn
  role_arn = aws_iam_role.events_ecs.arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.expiry.arn
    task_count          = 1
    launch_type         = "FARGATE"

    network_configuration {
      subnets          = aws_subnet.private[*].id
      security_groups  = [aws_security_group.api.id]
      assign_public_ip = false
    }
  }
}
