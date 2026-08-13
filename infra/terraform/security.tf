resource "aws_security_group" "alb" {
  name_prefix = "${local.name}-alb-"
  description = "Public ALB ingress"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTP from the internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle { create_before_destroy = true }
  tags = { Name = "${local.name}-alb-sg" }
}

resource "aws_security_group" "web" {
  name_prefix = "${local.name}-web-"
  description = "Next.js web tasks"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "From the ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle { create_before_destroy = true }
  tags = { Name = "${local.name}-web-sg" }
}

resource "aws_security_group" "api" {
  name_prefix = "${local.name}-api-"
  description = "FastAPI tasks (api, migrate, seed, expiry)"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "From the ALB"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "From the web task, via Cloud Map service discovery"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle { create_before_destroy = true }
  tags = { Name = "${local.name}-api-sg" }
}

resource "aws_security_group" "db" {
  name_prefix = "${local.name}-db-"
  description = "PostgreSQL, reachable only from API-family tasks"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "PostgreSQL from API/migrate/seed/expiry tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.api.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle { create_before_destroy = true }
  tags = { Name = "${local.name}-db-sg" }
}
