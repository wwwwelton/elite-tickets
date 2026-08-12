# Ticketmaster e redesign visual

Esta evolução substitui o catálogo externo anterior pela Ticketmaster Discovery
API v2 e aplica a linguagem editorial definida em `DESIGN.md` e nas referências
HTML de `docs/design/`. A chave do provedor permanece exclusivamente no backend.

## Fluxo entregue

- ORGANIZER pesquisa por palavra-chave, país e cidade usando o contrato interno
  `/api/v1/catalog/events`.
- A seleção consulta o detalhe normalizado e cria um evento EliteTickets com um
  snapshot imutável da origem (identificador, título, imagem, categoria e URL).
- Data, horário, local, capacidade, estoque e preço continuam sob controle do
  ORGANIZER.
- Eventos criados continuam funcionando sem nova consulta à Ticketmaster.
- Loading, vazio, autenticação/configuração, limite (429) e indisponibilidade têm
  estados distintos no catálogo.
- Customer, checkout, tickets/share e Gate preservam os fluxos existentes com
  componentes React reutilizáveis e layout responsivo.

## Validação local

Com PostgreSQL e os serviços Docker iniciados:

```bash
docker compose up --build -d --wait
docker compose run --rm api alembic upgrade head
docker compose run --rm api python -m elite_tickets.seed_demo
docker compose run --rm api pytest
```

No frontend:

```bash
cd apps/web
npm run lint
npm run typecheck
npm run test
npm run build
```

Os cenários Playwright em `apps/web/tests/e2e/` cobrem compra, seleção do
organizador, compartilhamento e validação da portaria. Para usar o catálogo real,
configure `TICKETMASTER_API_KEY` apenas no ambiente do backend.

## Referências

- `spec.md`, `plan.md` e `tasks.md` desta feature;
- `DESIGN.md` como fonte de verdade visual;
- `docs/design/stitch-prompts.md` e todos os `docs/design/*.html` como referências
  de composição e responsividade.
