# Implementation Plan: MVP de Eventos e Ingressos

**Branch**: `001-event-ticket-mvp` | **Date**: 2026-08-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-event-ticket-mvp/spec.md`

## Summary

Entregar em um monorepo um monólito modular com frontend Next.js App Router e API REST FastAPI para criação e publicação de eventos baseados em snapshot do TMDb, reserva e pagamento simulado, emissão, compartilhamento e validação de ingressos. PostgreSQL arbitra estoque, transições de reserva e consumo único por operações condicionais atômicas; JWT e checagens de propriedade/papel protegem todas as operações. A experiência segue `DESIGN.md` e as referências aprovadas em `docs/design`, reconstruídas como componentes React reutilizáveis.

## Technical Context

**Language/Version**: Python 3.12; TypeScript 5.x; Node.js 22 LTS

**Primary Dependencies**: FastAPI, Pydantic 2, SQLAlchemy 2, Alembic, psycopg 3, PyJWT, pwdlib/Argon2, httpx; Next.js 15+, React 19, App Router, QR rendering/scanning library; Playwright

**Storage**: PostgreSQL 16+; snapshots do TMDb e hashes de credenciais persistidos no banco; nenhum cache ou armazenamento de arquivo obrigatório

**Testing**: pytest + pytest-asyncio e PostgreSQL real para integração/concorrência; testes unitários de domínio e autorização; Playwright para um fluxo E2E completo de CUSTOMER

**Target Platform**: containers Linux via Docker Compose; frontend Vercel; API e PostgreSQL Render

**Project Type**: aplicação web em monorepo, monólito modular com frontend separado e uma única API REST/backend implantável

**Performance Goals**: 95% das listagens e aberturas de eventos em até 2 s nas condições de demonstração; operações críticas corretas sob concorrência têm prioridade sobre throughput

**Constraints**: estoque nunca negativo; no máximo um consumo por ingresso; reserva expira em 15 minutos; validação sempre online; QR e share token distintos; segredos somente por ambiente; sem microserviços, broker, Redis, Kubernetes, GraphQL ou pagamento real

**Scale/Scope**: MVP de desafio, três papéis, cerca de 15 telas aprovadas, uma API, um banco e dados de demonstração; dezenas de usuários concorrentes, com testes de contenção acima da carga esperada

## Constitution Check

*GATE inicial: PASS. Reavaliado após a Fase 1: PASS.*

| Gate constitucional | Evidência no desenho | Resultado |
|---|---|---|
| Fluxo principal ponta a ponta | Prioriza descoberta → reserva → pagamento → emissão → validação; quickstart e Playwright cobrem o percurso | PASS |
| Regras críticas e autorização no backend | Serviços de aplicação FastAPI aplicam transições, papel e propriedade; UI não é fronteira de segurança | PASS |
| Inventário e validação concorrentes | `UPDATE ... WHERE ... RETURNING`, constraints e transações PostgreSQL; testes concorrentes obrigatórios | PASS |
| QR não previsível | JWS assinado com nonce de pelo menos 128 bits e chave dedicada; estado confirmado no banco | PASS |
| Testes críticos | pytest cobre autorização, estoque, corridas, emissão, QR e consumo; Playwright cobre CUSTOMER | PASS |
| Simplicidade | Um backend, um frontend e um banco; sem componentes distribuídos proibidos | PASS |
| Docker Compose e demonstração | Compose inclui web, api, db e migração; seed reproduzível para os três papéis | PASS |
| Segredos | `.env.example`; JWT, QR e TMDb injetados em runtime | PASS |
| Fontes documental/visual | `spec.md`, este plano e `DESIGN.md` mantêm responsabilidades distintas; telas Stitch são referência, não código-fonte | PASS |
| IA verificada | implementação só poderá ser concluída após execução, revisão e testes | PASS |

Nenhuma violação ou exceção constitucional foi identificada. A revisão pós-design confirma que contratos, modelo e quickstart preservam todos os gates.

## Project Structure

### Documentation (this feature)

```text
specs/001-event-ticket-mvp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md             # gerado posteriormente por $speckit-tasks
```

### Source Code (repository root)

```text
apps/
├── api/
│   ├── alembic/
│   ├── src/elite_tickets/
│   │   ├── auth/
│   │   ├── catalog/
│   │   ├── events/
│   │   ├── reservations/
│   │   ├── tickets/
│   │   ├── shared/
│   │   ├── db/
│   │   └── main.py
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── concurrency/
└── web/
    ├── app/
    │   ├── (public)/
    │   ├── customer/
    │   ├── organizer/
    │   └── gate/
    ├── components/
    │   ├── ui/
    │   ├── events/
    │   └── tickets/
    ├── lib/
    └── tests/e2e/

infra/
└── render.yaml

compose.yaml
.env.example
```

**Structure Decision**: `apps/web` e `apps/api` são unidades implantáveis no mesmo monorepo. O backend é um monólito modular organizado por capacidade de negócio; módulos compartilham uma única transação e um único PostgreSQL sem chamadas internas HTTP. O frontend usa Server Components por padrão e Client Components apenas para interações, câmera, autenticação e mutações. Componentes visuais são derivados de `DESIGN.md` e dos screenshots, sem copiar os HTMLs gerados pelo Stitch.

## Technical Decisions

### Estoque e transições concorrentes

- O evento mantém contadores `reserved_quantity` e `sold_quantity` com `CHECK` garantindo valores não negativos e soma menor ou igual à capacidade.
- Reserva executa incremento condicional de `reserved_quantity` e cria a reserva na mesma transação. Sem linha retornada, responde conflito sem reserva parcial.
- Aprovação, recusa e expiração disputam `PENDING` por compare-and-set. O vencedor move os contadores e persiste pagamento/ingressos na mesma transação; repetições apenas devolvem o estado final.
- A expiração ocorre de forma lazy antes de leituras/mutações relevantes e por comando idempotente agendável no Render; não requer fila ou serviço adicional.

### QR, compartilhamento e validação

- O código textual e o QR exibem exatamente o mesmo JWS compacto e estático, assinado com chave exclusiva e contendo versão, `ticket_id`, `event_id`, nonce aleatório, `iat` e `kid` no cabeçalho. O banco guarda o hash do nonce.
- O token de compartilhamento é aleatório, opaco, independente, guardado somente como hash e nunca aceito pela validação GATE.
- Após verificar a assinatura e o evento, validação usa consumo condicional `used_at IS NULL`; zero linhas leva a uma leitura para distinguir `INVALID`, `ALREADY_USED` e `WRONG_EVENT`, sem consumir o ingresso.

### Fronteiras e integração

- Rotas finas chamam serviços de aplicação; modelos/repositórios SQLAlchemy ficam no módulo de negócio, e uma unidade de trabalho compartilha transações críticas.
- O adapter TMDb é chamado somente em busca/seleção. Criação persiste campos normalizados do snapshot e fluxos posteriores nunca dependem do catálogo.
- O simulador aceita somente `tok_approved` e `tok_declined`, exige `Idempotency-Key`, não coleta dados de cartão e persiste um único resultado por reserva/chave.

### Deploy e operação

- Docker Compose inicia PostgreSQL, executa Alembic, sobe FastAPI e Next.js e oferece comando idempotente de seed.
- Vercel recebe `NEXT_PUBLIC_API_BASE_URL`; Render recebe URL do banco e segredos de JWT, QR e TMDb. CORS permite apenas as origens configuradas.
- A API expõe `/health/live` e `/health/ready`; o segundo verifica conectividade com PostgreSQL. Migrações rodam como pre-deploy command, não em cada worker.

## Complexity Tracking

Não aplicável: o desenho não viola a constituição e não adiciona componentes além dos exigidos.
