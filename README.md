# EliteTickets

Plataforma completa de eventos e ingressos desenvolvida para o Desafio Elite Dev
2026. O MVP oferece catálogo público, gestão de eventos, reserva e pagamento
simulados, ingressos com QR assinado, validação de portaria e compartilhamento
público temporário.

## Stack e requisitos

- Next.js 15, React 19 e TypeScript
- FastAPI, SQLAlchemy e Alembic em Python 3.12
- PostgreSQL 17
- Docker Engine com Docker Compose v2
- Node.js 22 apenas para executar ferramentas do frontend fora do container

As regras de negócio e autorização ficam na API. Os papéis disponíveis são
`ORGANIZER`, `CUSTOMER` e `GATE`.

## Executar localmente

Crie a configuração local e substitua JWT, QR e TMDb por valores próprios. JWT e
QR devem ser diferentes e ter pelo menos 32 bytes; nunca versione o arquivo `.env`.

```bash
cp .env.example .env
docker compose up --build -d --wait
docker compose run --rm api alembic upgrade head
docker compose run --rm api python -m elite_tickets.seed_demo
docker compose ps
```

A migration também é executada automaticamente pelo serviço one-shot `migrate`.
O comando explícito acima é seguro e documenta a revisão aplicada. O seed é
idempotente e pode ser repetido sem duplicar contas ou eventos.

Depois da inicialização:

- frontend: <http://localhost:3000>
- API: <http://localhost:8000>
- documentação OpenAPI: <http://localhost:8000/docs>
- saúde: <http://localhost:8000/health/live> e
  <http://localhost:8000/health/ready>

### Dados de demonstração

Todas as contas abaixo são exclusivamente locais e usam a senha
`DemoElite2026!`:

| Papel | E-mail |
| --- | --- |
| ORGANIZER | `organizer@demo.elitetickets.local` |
| CUSTOMER | `customer@demo.elitetickets.local` |
| GATE | `gate@demo.elitetickets.local` |

O evento publicado do seed permite percorrer o fluxo sem consultar o TMDb. Na
tela de pagamento, use apenas os tokens simulados:

- `tok_approved`: aprova, vende a reserva e emite os ingressos uma única vez;
- `tok_declined`: recusa, não emite ingressos e libera o inventário.

Esses valores não são credenciais financeiras e nunca devem ser tratados como
tokens reais.

## Walkthrough do MVP

1. Como CUSTOMER, pesquise o evento publicado, reserve ingressos e pague com
   `tok_approved`. Confira o QR e o código textual em Meus Ingressos.
2. Gere um link de compartilhamento e abra-o sem sessão. A página é somente
   leitura e deixa de expor o QR depois do uso ou do fim do evento.
3. Como GATE, selecione o evento e valide o código. A primeira tentativa retorna
   `VALID`; repetições retornam `ALREADY_USED`. Sem API, a tela nunca autoriza
   entrada offline.
4. Como ORGANIZER, pesquise um filme no TMDb, crie um evento `DRAFT`, publique-o
   e confirme sua presença na vitrine. Eventos existentes usam o snapshot salvo
   e continuam legíveis quando o TMDb está indisponível.
5. Crie outra reserva como CUSTOMER e use `tok_declined` para confirmar que não
   há emissão nem nova tentativa de aprovação da mesma recusa.

## Expiração de reservas

O serviço `expiry` usa a mesma imagem da API e executa o comando idempotente a
cada 60 segundos:

```bash
docker compose run --rm api python -m elite_tickets.reservations.expire
docker compose logs --follow expiry
```

Executar o comando manualmente mais de uma vez é seguro. Em produção,
`infra/render.yaml` agenda o equivalente com `* * * * *` (uma vez por minuto).

## Testes e verificações

Com o Compose saudável e o seed aplicado:

```bash
docker compose run --rm api pytest
docker compose run --rm api pytest -m concurrency -v
docker compose run --rm web npm test
docker compose run --rm web npm run lint
docker compose run --rm web npm run typecheck

cd apps/web
E2E_WEB_URL=http://localhost:3000 \
E2E_API_URL=http://localhost:8000/api/v1 \
./node_modules/.bin/playwright test --project=chromium
```

Os testes concorrentes usam PostgreSQL e conexões independentes para provar
inventário não negativo, pagamento versus expiração/cancelamento e consumo único
do ingresso. O relatório da validação local está em
[`specs/001-event-ticket-mvp/validation/deployment.md`](specs/001-event-ticket-mvp/validation/deployment.md).

## Implantação

`infra/render.yaml` descreve PostgreSQL, API, migration pre-deploy e o cron de
expiração no Render. Configure na plataforma `DATABASE_URL`, `JWT_SECRET`,
`QR_SECRET`, `TICKETMASTER_API_KEY` e `CORS_ORIGINS`; JWT e QR devem ser secretos e
distintos. O frontend pode ser implantado na Vercel com:

- `NEXT_PUBLIC_API_BASE_URL`: URL HTTPS pública da API terminada em `/api/v1`;
- `API_INTERNAL_BASE_URL`: URL alcançável pelos Server Components, também
  terminada em `/api/v1`.

Recompile o frontend sempre que `NEXT_PUBLIC_API_BASE_URL` mudar, pois variáveis
`NEXT_PUBLIC_*` são incorporadas ao bundle. Em produção, limite `CORS_ORIGINS` às
origens HTTPS esperadas e confirme os smoke checks descritos em
[`quickstart.md`](specs/001-event-ticket-mvp/quickstart.md).

## Troubleshooting

- **Porta ocupada:** altere `POSTGRES_PORT`, `API_PORT` ou `WEB_PORT` no `.env` e
  recrie os serviços.
- **API não inicia:** confirme que JWT/QR têm pelo menos 32 bytes, são diferentes
  e que `TICKETMASTER_API_KEY` não está vazio; depois consulte `docker compose logs api migrate`.
- **Frontend mostra eventos indisponíveis:** dentro do Compose,
  `API_INTERNAL_BASE_URL` deve apontar para `http://api:8000/api/v1`. No navegador,
  `NEXT_PUBLIC_API_BASE_URL` deve ser acessível pela máquina do usuário.
- **Login bloqueado por CORS:** use a mesma origem configurada em `CORS_ORIGINS`.
  A configuração local padrão permite `http://localhost:3000`, não
  `http://127.0.0.1:3000`.
- **TMDb falha:** valide a chave e a conectividade. O catálogo do ORGANIZER requer
  TMDb, mas a vitrine e eventos já salvos usam snapshots locais.
- **Migration pendente:** execute
  `docker compose run --rm api alembic upgrade head` e confira
  `docker compose run --rm api alembic current`.
- **Recriar banco local:** `docker compose down --volumes` remove somente o volume
  PostgreSQL deste projeto. Os dados são perdidos e devem ser recriados com
  migrations e seed; não use o comando se precisar preservá-los.
