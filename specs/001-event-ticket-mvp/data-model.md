# Data Model: MVP de Eventos e Ingressos

## Conventions

- IDs internos: UUID v7 (UUID nativo no PostgreSQL); nunca funcionam como credencial.
- Valores monetários: `numeric(12,2)` e código de moeda `BRL`; nunca `float`.
- Instantes: `timestamptz` em UTC; evento guarda também timezone IANA para apresentação.
- Enums são validados no domínio e persistidos como enum/check; timestamps de criação/alteração são obrigatórios.
- Tokens/nonce secretos são gerados por CSPRNG e somente seus hashes SHA-256 são persistidos quando comparação direta é suficiente.

## User

| Field | Type | Rules |
|---|---|---|
| id | UUID | PK |
| email | varchar(320) | unique, normalizado, obrigatório |
| password_hash | text | Argon2, obrigatório |
| display_name | varchar(120) | obrigatório |
| role | `ORGANIZER \| CUSTOMER \| GATE` | exatamente um papel |
| is_active | boolean | default true |
| created_at, updated_at | timestamptz | obrigatórios |

Relationships: ORGANIZER 1:N Event; CUSTOMER 1:N Reservation e Ticket; GATE 1:N TicketValidation.

## Event

| Field | Type | Rules |
|---|---|---|
| id | UUID | PK |
| organizer_id | UUID | FK User; proprietário deve ser ORGANIZER |
| state | `DRAFT \| PUBLISHED \| CANCELLED \| FINISHED` | default DRAFT |
| venue_name | varchar(180) | obrigatório |
| venue_address | varchar(300) | obrigatório |
| starts_at, ends_at | timestamptz | fim posterior ao início |
| timezone | varchar(64) | timezone IANA válida |
| capacity | integer | > 0 |
| reserved_quantity | integer | >= 0; default 0 |
| sold_quantity | integer | >= 0; default 0 |
| price | numeric(12,2) | >= 0 |
| currency | char(3) | `BRL` no MVP |
| published_at, cancelled_at | timestamptz nullable | coerentes com estado |
| created_at, updated_at | timestamptz | obrigatórios |

Constraint crítica: `reserved_quantity + sold_quantity <= capacity`. Disponível é derivado como `capacity - reserved_quantity - sold_quantity` e nunca persistido separadamente.

State transitions:

```text
DRAFT ──publish──> PUBLISHED ──cancel──> CANCELLED
                          └──ends_at──> FINISHED
```

Não existem transições de retorno. Consultas/mutações aplicam a finalização temporal antes de decidir elegibilidade. Cancelamento expira reservas pendentes e torna ingressos inelegíveis na mesma unidade transacional.

## MovieSnapshot

Relacionamento 1:1 com Event; imutável depois da criação.

| Field | Type | Rules |
|---|---|---|
| event_id | UUID | PK/FK Event |
| tmdb_id | integer | obrigatório, > 0 |
| media_type | varchar(16) | `movie` no MVP |
| title | varchar(300) | obrigatório |
| overview | text nullable | snapshot |
| poster_path, backdrop_path | text nullable | caminhos TMDb, nunca segredo |
| release_date | date nullable | snapshot |
| original_language | varchar(16) nullable | snapshot |
| genres | jsonb | array normalizado de `{id,name}` |
| snapshot_at | timestamptz | obrigatório |

## Reservation

| Field | Type | Rules |
|---|---|---|
| id | UUID | PK |
| event_id | UUID | FK Event |
| customer_id | UUID | FK User CUSTOMER |
| status | `PENDING \| APPROVED \| DECLINED \| EXPIRED \| CANCELLED` | default PENDING |
| quantity | integer | > 0 |
| unit_price | numeric(12,2) | snapshot do preço, >= 0 |
| total_amount | numeric(12,2) | `quantity * unit_price` |
| currency | char(3) | obrigatório |
| expires_at | timestamptz | `created_at + 15 min` |
| completed_at | timestamptz nullable | obrigatório em estado terminal |
| created_at, updated_at | timestamptz | obrigatórios |

Relationships: Reservation N:1 Event/Customer; 1:0..1 SimulatedPayment; 1:N Ticket quando APPROVED.

Transitions:

```text
PENDING ──approved before expiry──> APPROVED
       ├──declined before expiry──> DECLINED
       ├──timeout─────────────────> EXPIRED
       └──event cancelled─────────> CANCELLED
```

Estados terminais são imutáveis. Apenas PENDING compromete `reserved_quantity`; APPROVED compõe `sold_quantity`; os outros não comprometem estoque.

## SimulatedPayment

| Field | Type | Rules |
|---|---|---|
| id | UUID | PK |
| reservation_id | UUID | unique FK Reservation |
| idempotency_key | varchar(128) | unique por CUSTOMER/endpoint; obrigatório |
| test_token | enum interno | `tok_approved \| tok_declined`; não é dado financeiro |
| decision | `APPROVED \| DECLINED` | imutável |
| processed_at | timestamptz | obrigatório |

Não armazena cartão, CVV ou identidade de pagamento. Repetição compatível retorna a decisão existente; reutilização da chave com payload diferente retorna conflito.

## Ticket

| Field | Type | Rules |
|---|---|---|
| id | UUID | PK |
| reservation_id | UUID | FK Reservation APPROVED |
| event_id | UUID | FK Event |
| owner_id | UUID | FK User CUSTOMER; imutável no MVP |
| ordinal | integer | > 0; unique `(reservation_id, ordinal)` |
| qr_credential | text | unique; JWS compacto estático exibido no QR e em texto; tratado como dado sensível |
| qr_nonce_hash | bytea | unique; hash de nonce >= 128 bits |
| qr_key_id | varchar(32) | versão da chave |
| status | `ACTIVE \| CANCELLED` | cancelado acompanha evento |
| issued_at | timestamptz | obrigatório |
| used_at | timestamptz nullable | write-once |
| used_by_id | UUID nullable | FK GATE; ambos nulos ou ambos preenchidos |

O JWS armazenado permite reexibir exatamente o mesmo código estático; a assinatura e o hash do nonce são verificados antes da consulta autoritativa. Logs nunca registram a credencial completa. Elegibilidade exige assinatura válida, nonce correspondente, reserva aprovada, evento publicado/não terminado, status ACTIVE e `used_at IS NULL`.

## TicketShare

| Field | Type | Rules |
|---|---|---|
| id | UUID | PK |
| ticket_id | UUID | unique FK Ticket |
| token_hash | bytea | unique; token aleatório >= 128 bits |
| created_at | timestamptz | obrigatório |

Validade é derivada: ticket não usado, ACTIVE e `now() < event.ends_at`. Não concede mutação ou propriedade e não é aceito como QR.

## TicketValidation

| Field | Type | Rules |
|---|---|---|
| id | UUID | PK |
| selected_event_id | UUID | FK Event |
| gate_user_id | UUID | FK User GATE |
| ticket_id | UUID nullable | somente quando identificável sem revelar ao cliente |
| result | `VALID \| INVALID \| ALREADY_USED \| WRONG_EVENT` | obrigatório |
| attempted_at | timestamptz | obrigatório |

Cada tentativa gera um log; somente `VALID` muda `Ticket.used_at`, na mesma transação. O contrato externo não revela por que uma credencial inválida falhou.

## Indexes and integrity

- `events(state, starts_at)` e índice de busca por título/local (trigram ou expressão após medição).
- `events(organizer_id, created_at desc)`.
- `reservations(customer_id, created_at desc)`, `reservations(event_id, status, expires_at)` para expiração.
- `tickets(owner_id, issued_at desc)`, `tickets(event_id, used_at)`.
- unicidades de pagamento, ordinal, nonce e share hash sustentam idempotência.
- FKs não permitem cascade delete de registros financeiros/de auditoria; deleção de domínio não integra o MVP.
