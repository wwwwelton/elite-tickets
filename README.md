# EliteTickets

Plataforma completa de eventos e ingressos desenvolvida para o Desafio Elite Dev
2026. O MVP oferece catálogo público, gestão de eventos, reserva e pagamento
simulados, ingressos com QR assinado, validação de portaria e compartilhamento
público temporário.

## Stack e requisitos

- Next.js 16, React 19, TypeScript e Bootstrap 5
- FastAPI, SQLAlchemy e Alembic em Python 3.12
- PostgreSQL 17
- Docker Engine com Docker Compose v2
- Node.js 22 apenas para executar ferramentas do frontend fora do container

As regras de negócio e autorização ficam na API. Os papéis disponíveis são
`ORGANIZER`, `CUSTOMER` e `GATE`.

## Executar localmente

Crie a configuração local e substitua JWT, QR e Ticketmaster por valores próprios. JWT e
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

O `docker compose up --build -d --wait` agora sobe também o frontend Next.js em
`apps/web/` como o serviço `web`, exposto em `http://localhost:3000`. O frontend
usa `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1` por padrão e a API
aceita `CORS_ORIGINS` para `http://localhost:3000` e `http://localhost:3001`
durante o desenvolvimento local.

### Dados de demonstração

Todas as contas abaixo são exclusivamente locais e usam a senha
`DemoElite2026!`:

| Papel | E-mail |
| --- | --- |
| ORGANIZER | `organizer@demo.elitetickets.local` |
| CUSTOMER | `customer@demo.elitetickets.local` |
| GATE | `gate@demo.elitetickets.local` |

Também é possível criar a própria conta em `/register`, escolhendo entre
`CUSTOMER`, `ORGANIZER` e `GATE`. O papel retornado pela API decide para onde a
sessão é direcionada.

O evento publicado do seed permite percorrer o fluxo sem consultar a Ticketmaster. Na
tela de pagamento, escolha um dos cartões simulados, que enviam os tokens
aceitos pela API:

- `tok_approved`: aprova, vende a reserva e emite os ingressos uma única vez;
- `tok_declined`: recusa, não emite ingressos e libera o inventário.

Esses valores não são credenciais financeiras e nunca devem ser tratados como
tokens reais.

## Frontend

O app em `apps/web/` consome apenas as rotas verificadas em
[`docs/api-reference.md`](docs/api-reference.md). A estilização é Bootstrap 5;
`app/globals.css` é somente uma camada de tema sobre variáveis `--bs-*`, mais os
poucos componentes que o Bootstrap não cobre (canhoto perfurado, mapa de
assentos, moldura do scanner).

| Rota | Papel | Uso |
| --- | --- | --- |
| `/`, `/search`, `/events/{id}` | público | vitrine, busca e detalhe do evento |
| `/login`, `/register` | público | autenticação e criação de conta |
| `/events/{id}/reserve` | CUSTOMER | seleção de ingressos e criação da reserva |
| `/customer/checkout/{reservationId}` | CUSTOMER | revisão do pedido e pagamento simulado |
| `/customer/tickets`, `/customer/tickets/{id}` | CUSTOMER | ingressos, QR e compartilhamento |
| `/shared/tickets/{token}` | público | visão somente leitura do ingresso |
| `/organizer/events`, `/organizer/events/new`, `/organizer/catalog` | ORGANIZER | painel, criação e catálogo externo |
| `/gate` | GATE | seleção do evento e validação |

A seleção de ingressos muda conforme o local: locais de cinema abrem um mapa de
assentos, os demais abrem setores com quantidade. Os dois modos são camada de
apresentação — o que vai para a API é sempre `quantity`, e o limite por pedido
vem do `available_quantity` real do evento.

O QR é gerado no próprio frontend a partir da credencial assinada que a API
emite (`apps/web/lib/qr.ts`), sem depender de serviço externo.

## Walkthrough do MVP

1. Como CUSTOMER, pesquise o evento publicado, escolha assentos ou setores,
   revise o pedido dentro da contagem regressiva da reserva e pague com o cartão
   aprovado. Confira o QR em Meus Ingressos.
2. Gere um link de compartilhamento e abra-o sem sessão. A página é somente
   leitura e deixa de expor o QR depois do uso ou do fim do evento.
3. Como GATE, selecione o evento e valide a credencial. A primeira tentativa
   retorna `VALID`; repetições retornam `ALREADY_USED`. Sem API, a tela nunca
   autoriza entrada offline.
4. Como ORGANIZER, pesquise um show ou evento na Ticketmaster, crie um evento `DRAFT`, publique-o
   e confirme sua presença na vitrine. Eventos existentes usam o snapshot salvo
   e continuam legíveis quando a Ticketmaster está indisponível.
5. Crie outra reserva como CUSTOMER e use o cartão recusado: nenhum ingresso é
   emitido e a reserva é encerrada, então a tela oferece iniciar um novo pedido
   em vez de repetir o pagamento.

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
```

Os testes do frontend rodam fora do container, com Node.js 22 ou superior:

```bash
cd apps/web
npm install
npm test -- --run
npm run build
```

Os testes concorrentes usam PostgreSQL e conexões independentes para provar
inventário não negativo, pagamento versus expiração/cancelamento e consumo único
do ingresso. O relatório da validação local está em
[`specs/001-event-ticket-mvp/validation/deployment.md`](specs/001-event-ticket-mvp/validation/deployment.md).

## Implantação

`infra/render.yaml` descreve PostgreSQL, API, migration pre-deploy e o cron de
expiração no Render. Configure na plataforma `DATABASE_URL`, `JWT_SECRET`,
`QR_SECRET`, `TICKETMASTER_API_KEY` e `CORS_ORIGINS`; JWT e QR devem ser secretos e
distintos. Em produção, limite `CORS_ORIGINS` às origens HTTPS esperadas e
confirme os smoke checks descritos em
[`quickstart.md`](specs/001-event-ticket-mvp/quickstart.md).

## Troubleshooting

- **Porta ocupada:** altere `POSTGRES_PORT` ou `API_PORT` no `.env` e
  recrie os serviços.
- **API não inicia:** confirme que JWT/QR têm pelo menos 32 bytes, são diferentes
  e que `TICKETMASTER_API_KEY` não está vazio; depois consulte `docker compose logs api migrate`.
- **Ticketmaster falha:** valide `TICKETMASTER_API_KEY` e a conectividade. O
  catálogo do ORGANIZER sinaliza indisponibilidade, mas a vitrine e eventos já
  salvos usam snapshots locais.
- **Migration pendente:** execute
  `docker compose run --rm api alembic upgrade head` e confira
  `docker compose run --rm api alembic current`.
- **Recriar banco local:** `docker compose down --volumes` remove somente o volume
  PostgreSQL deste projeto. Os dados são perdidos e devem ser recriados com
  migrations e seed; não use o comando se precisar preservá-los.
