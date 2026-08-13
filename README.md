# EliteTickets

Plataforma completa de eventos e ingressos desenvolvida como case para o
Desafio Elite Dev 2026. É uma **POC (prova de conceito)**, construída com
**SDD (Spec-Driven Development)**, que oferece catálogo público, gestão de
eventos, reserva e pagamento simulados, ingressos com QR assinado, validação
de portaria e compartilhamento público temporário.

## Metodologia

O projeto foi construído com **SDD (Spec-Driven Development)** usando o
[GitHub Spec Kit](https://github.com/github/spec-kit): cada funcionalidade
nasce como uma especificação em `specs/<feature>/spec.md`, é detalhada em
`plan.md`/`tasks.md`/`data-model.md` e só então implementada — a pasta
`specs/` e as extensões em `.specify/` refletem esse fluxo feature a feature,
do MVP (`001-event-ticket-mvp`) até o frontend completo
(`005-complete-ticketing-frontend`). O direcionamento visual (`DESIGN.md`) foi
prototipado no **Google Stitch** antes de virar tokens e componentes.

A redação das especificações foi dividida por camada: a spec do backend foi
feita com o **Codex** e a spec do frontend com o **Claude**, cada um
responsável por detalhar as regras de negócio e a experiência da sua própria
camada antes da implementação.

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
docker compose ps
```

Migration e seed rodam sozinhos, como serviços one-shot (`migrate` e `seed`) que
a API espera concluir antes de subir — o catálogo já aparece populado no primeiro
acesso. Para reaplicar qualquer um deles à mão:

```bash
docker compose run --rm api alembic upgrade head
docker compose run --rm seed
```

O seed é idempotente e pode ser repetido sem duplicar contas ou eventos.

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

#### Eventos do seed

O seed cria dois tipos de evento, ambos publicados e pertencentes ao ORGANIZER
demo:

- **Fixture local** (`Clube da Luta — Sessão Elite`): sempre criada, sem rede.
  É a garantia de que o fluxo de compra funciona mesmo sem a Ticketmaster.
- **Snapshots da Ticketmaster**: com `TICKETMASTER_API_KEY` válida, o seed busca
  os próximos eventos publicados em qualquer país e grava até doze deles com o
  mesmo formato de snapshot que o fluxo do organizador produz — título, pôster,
  categoria, local, endereço, cidade, data e fuso reais.

A busca não é restrita a nenhum país: a agenda global da Ticketmaster é
dominada por um punhado de cidades grandes, então pegar os primeiros por data
deixaria o catálogo quase todo concentrado nelas. A seleção é feita em rodízio
por local (país + estado/região, ou país + cidade quando não há estado): cada
local com evento disponível entra antes que qualquer um receba um segundo,
sempre priorizando as datas mais próximas dentro de cada um. Aumentar
`DEMO_CATALOG_EVENT_LIMIT` amplia primeiro a cobertura global e só depois
adensa os locais mais movimentados.

Capacidade e preço não são publicados pelo catálogo: o seed usa
`DEMO_CAPACITY`/`DEMO_PRICE` e só adota o preço do upstream quando ele existe em
BRL. Se a Ticketmaster estiver indisponível ou a chave for inválida, o seed
avisa no console e segue apenas com a fixture local. O seed é idempotente por
`external_id`, então repetir o comando não duplica eventos.

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

### Explorar vs. Buscar

O menu inferior (`apps/web/components/shell/bottom-nav.tsx`) tem dois itens
que podem parecer redundantes à primeira vista, mas atendem a intenções
diferentes de quem está navegando o catálogo:

- **Explorar** é um link estático para `/`, a home com o feed curado —
  eventos em destaque e a lista completa, sem nenhum filtro aplicado. Existe
  para quem quer navegar e descobrir o que está disponível.
- **Buscar** existe para quem já sabe o que procura. Como item do menu, leva
  para `/search`, a tela dedicada a percorrer todos os eventos publicados.
  Como botão de formulário (presente tanto na home quanto em `/search`, via
  `apps/web/components/events/event-search.tsx`), é a ação que efetivamente
  filtra: ao ser enviado, o termo digitado vai para
  `/search?query=<termo>`, que a API usa para retornar apenas os eventos
  correspondentes.

Resumindo: **Explorar** é o feed curado da home; **Buscar** é tanto a
entrada para a tela de todos os eventos quanto a ação que efetivamente
filtra eventos por um termo digitado.

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

### Integração contínua

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) roda em todo push e
pull request e reproduz exatamente os comandos acima, para que "passou local"
e "passou no CI" signifiquem a mesma coisa:

- **backend**: sobe um Postgres 17 como serviço do job, aplica as migrations
  com Alembic e roda `pytest` (as 84 asserções de unit/integration/concurrency)
  contra um banco real — não contra mocks;
- **frontend**: `npm test -- --run` (Vitest + Testing Library) e depois
  `npm run build`, então uma regressão de tipos ou de build quebra o CI antes
  de chegar a um deploy.

Um job final (`ci`) agrega os dois anteriores e falha se qualquer um não for
`success`, dando um único status check para proteger a branch principal — sem
ele, um PR poderia ficar verde mesmo com o job de frontend vermelho, já que
GitHub Actions não bloqueia por padrão em jobs paralelos sem essa agregação.

## Implantação

`infra/render.yaml` descreve PostgreSQL, API, migration pre-deploy e o cron de
expiração no Render. Configure na plataforma `DATABASE_URL`, `JWT_SECRET`,
`QR_SECRET`, `TICKETMASTER_API_KEY` e `CORS_ORIGINS`; JWT e QR devem ser secretos e
distintos. Em produção, limite `CORS_ORIGINS` às origens HTTPS esperadas e
confirme os smoke checks descritos em
[`quickstart.md`](specs/001-event-ticket-mvp/quickstart.md).

### AWS (São Paulo — `sa-east-1`)

[`infra/terraform`](infra/terraform) descreve a mesma topologia em Terraform
para quem precisa rodar em AWS, na região sa-east-1 (a única região da AWS na
América do Sul), em vez de depender de um PaaS:

- **Rede:** VPC dedicada, sub-redes públicas (ALB, NAT) e privadas (ECS, RDS)
  em duas zonas de disponibilidade;
- **API e web:** dois serviços ECS Fargate atrás de um único Application Load
  Balancer — `/` roteia para o `web`, e `/api/v1/*`, `/docs*` e `/health/*`
  roteiam para a `api`, então o frontend e a API expõem uma origem só, sem
  precisar de domínio/certificado adicional para funcionar;
- **`web` → `api` interno:** um namespace privado do Cloud Map resolve
  `api.elite-tickets.internal`, reproduzindo o `http://api:8000` que já existe
  na rede do Compose;
- **Banco:** RDS PostgreSQL 17 em sub-rede privada, acessível somente a partir
  das tasks da família `api`;
- **Segredos:** `JWT_SECRET`, `QR_SECRET`, `TICKETMASTER_API_KEY` e a
  `DATABASE_URL` completa ficam no Secrets Manager e são injetados nas tasks
  pelo ECS — nunca em variável de ambiente em texto plano nem na imagem;
  `migrate` e `seed` continuam sendo tasks avulsas, disparadas manualmente
  como no Compose, agora via `aws ecs run-task`;
- **Expiração:** uma regra do EventBridge (`rate(1 minute)`) dispara a task de
  expiração uma vez por minuto — o mesmo cron do `render.yaml`, mas sem manter
  um container rodando o dia inteiro só para dormir entre execuções.

O guia completo (pré-requisitos, `terraform apply`, build/push das imagens
para o ECR, execução de `migrate`/`seed` e o que ainda falta — TLS, domínio
próprio, autoscaling) está em
[`infra/terraform/README.md`](infra/terraform/README.md).

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
