# Terraform — AWS South America (sa-east-1)

Provisions EliteTickets on AWS, in the São Paulo region (`sa-east-1`, the only
AWS South America region). It mirrors the topology already described by
`compose.yaml` (local) and `infra/render.yaml` (Render):

| Compose / Render                        | AWS                                                              |
| ---------------------------------------- | ----------------------------------------------------------------- |
| `postgres` service                       | RDS for PostgreSQL 17, private subnets only                       |
| `api` service                            | ECS Fargate service `elite-tickets-api`, behind the ALB           |
| `web` service                            | ECS Fargate service `elite-tickets-web`, behind the same ALB      |
| `migrate` one-shot service                | ECS task definition `elite-tickets-migrate`, run manually         |
| `seed` one-shot service                   | ECS task definition `elite-tickets-seed`, run manually            |
| `expiry` loop (`sleep 60`)                | EventBridge rule (`rate(1 minute)`) running the `expiry` task — same cadence as `render.yaml`'s cron, without a permanently-running container |
| Docker network (`api` reachable by name) | Cloud Map private DNS namespace (`elite-tickets.internal`), so `web` reaches `api` the same way it does locally |

The web app and the API share one Application Load Balancer: `/` routes to
`web`, and `/api/v1/*`, `/docs*`, `/openapi.json`, `/health/*` route to `api`.
That keeps `NEXT_PUBLIC_API_BASE_URL` and `CORS_ORIGINS` pointed at a single
origin, exactly like `http://localhost:3000` talking to `http://localhost:8000`
does today, just consolidated under one DNS name — no second domain or
certificate required to get a working deployment.

## Prerequisites

- Terraform >= 1.6
- An AWS account with the `sa-east-1` region enabled, and credentials
  available to the AWS provider (`aws configure`, or `AWS_ACCESS_KEY_ID` /
  `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN`)
- Docker, to build and push the `apps/api` and `apps/web` images
- The AWS CLI, for the ECR login and for running the one-off `migrate`/`seed`/
  post-deploy tasks

## 1. First apply — creates the ECR repositories (and everything else)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # fill in db_password / jwt_secret / qr_secret / ticketmaster_api_key
terraform init
terraform apply
```

The very first apply will create `api`/`web` ECS services pointing at
`:latest`, which does not exist yet in the new ECR repos — the services will
sit unhealthy until you push real images (step 2) and (if you changed the
tag) re-apply. That's expected and safe; nothing else in the plan depends on
the containers actually running.

## 2. Build and push the images

```bash
cd infra/terraform
API_REPO=$(terraform output -raw ecr_api_repository_url)
WEB_REPO=$(terraform output -raw ecr_web_repository_url)

aws ecr get-login-password --region sa-east-1 \
  | docker login --username AWS --password-stdin "${API_REPO%/*}"

docker build -t "$API_REPO:latest" ../../apps/api
docker push "$API_REPO:latest"

docker build -t "$WEB_REPO:latest" ../../apps/web
docker push "$WEB_REPO:latest"
```

`apps/web/Dockerfile` currently runs `next dev`, not a production build — fine
to get the stack running end-to-end, but revisit it (`next build && next
start`, or `output: "standalone"`) before treating this as a real production
deploy. This is a known gap, also called out in `DESIGN.md`.

Then either wait for the next ECS deployment cycle or force one:

```bash
CLUSTER=$(terraform output -raw ecs_cluster_name)
aws ecs update-service --cluster "$CLUSTER" --service elite-tickets-api --force-new-deployment
aws ecs update-service --cluster "$CLUSTER" --service elite-tickets-web --force-new-deployment
```

## 3. Run migrations and seed the demo catalog

Fargate has no built-in "run once on deploy" hook (unlike Render's
`preDeployCommand`), so `migrate` and `seed` are plain task definitions you
invoke with `aws ecs run-task`:

```bash
CLUSTER=$(terraform output -raw ecs_cluster_name)
SUBNETS=$(terraform output -json private_subnet_ids | jq -c .)
SG=$(terraform output -raw api_security_group_id)

aws ecs run-task --cluster "$CLUSTER" \
  --task-definition "$(terraform output -raw migrate_task_definition_arn)" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=$SUBNETS,securityGroups=[$SG],assignPublicIp=DISABLED}"

aws ecs run-task --cluster "$CLUSTER" \
  --task-definition "$(terraform output -raw seed_task_definition_arn)" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=$SUBNETS,securityGroups=[$SG],assignPublicIp=DISABLED}"
```

Both are idempotent, same as locally — safe to re-run after every deploy that
changes the schema or the seed logic.

## 4. Open it

```bash
terraform output alb_dns_name
```

Web at `http://<alb-dns-name>/`, API at `http://<alb-dns-name>/api/v1`,
OpenAPI docs at `http://<alb-dns-name>/docs`.

## What this does not cover

- **TLS / custom domain**: the ALB listens on plain HTTP only. Add an ACM
  certificate, an HTTPS listener, and a Route 53 record before pointing a real
  domain at this.
- **Remote state**: state is local by default (`terraform.tfstate` next to
  these files, gitignored). Uncomment the `backend "s3"` block in
  `versions.tf` and point it at a bucket + DynamoDB lock table before more
  than one person runs this.
- **CI/CD wiring**: nothing here builds/pushes images or runs `terraform
  apply` automatically. `.github/workflows/ci.yml` runs tests on every push;
  wiring it (or a separate deploy workflow) to build these images and update
  the ECS services on merge is a natural next step, not yet implemented.
- **Autoscaling**: `api`/`web` run a fixed `desired_count` (default `1`
  each). Fine for a demo-scale deployment; add `aws_appautoscaling_target` /
  `_policy` resources before real traffic.

## Destroying

```bash
terraform destroy
```

`skip_final_snapshot = true` on the RDS instance means the database is
deleted with no snapshot — back up anything you care about first.
