# EliteTickets - Agent Instructions

## Objective

Build a small but complete event and ticket platform for the Elite Dev 2026 challenge.

Prioritize an end-to-end working product over optional complexity.

## Architecture

- Frontend: Next.js + React + TypeScript
- Backend: Python + FastAPI
- Database: PostgreSQL
- ORM: SQLAlchemy
- Migrations: Alembic
- Local environment: Docker Compose
- External catalog: TMDb
- Authentication: JWT with role-based authorization

## Roles

- ORGANIZER
- CUSTOMER
- GATE

## Engineering rules

1. Business rules live in the backend.
2. Do not trust authorization decisions made only by the frontend.
3. Critical inventory operations must be atomic.
4. A ticket must never be consumed twice.
5. Inventory must never become negative.
6. QR validation must not rely on a predictable ticket ID alone.
7. Critical requirements require automated tests.
8. Prefer simple readable code over unnecessary abstractions.
9. Do not introduce microservices, queues or caches unless a requirement proves they are necessary.
10. Never commit secrets.
11. Every behavior change must correspond to the specification.
12. DESIGN.md defines visual direction, not application architecture.

## AI development

Generated code must be reviewed, executed and tested before being committed.

Never commit a large implementation solely because an AI generated it.
