# Phase 0 Research: MVP de Eventos e Ingressos

## Baseline tecnológico

**Decision**: Adotar Python 3.12, SQLAlchemy/Pydantic 2, PostgreSQL 16+, Node.js 22 LTS, TypeScript 5, Next.js App Router e React, mantendo versões exatas em lockfiles e imagens Docker.

**Rationale**: São versões modernas compatíveis com o stack obrigatório; lockfiles tornam ambiente local, CI e deploy reproduzíveis.

**Alternatives considered**: versões sem pin (reprodutibilidade fraca); stacks adicionais ou frameworks diferentes (fora das restrições).

## Monorepo e monólito modular

**Decision**: Separar `apps/web` e `apps/api`; dividir a API por capacidades (`auth`, `catalog`, `events`, `reservations`, `tickets`, `shared`) que compartilham processo, banco e transações.

**Rationale**: Preserva fronteiras legíveis sem custo operacional distribuído e permite deploy independente de frontend e backend.

**Alternatives considered**: organização apenas por camadas globais (cresce acoplamento); microserviços (complexidade e consistência distribuída sem requisito); GraphQL (proibido e desnecessário).

## Reserva atômica de inventário

**Decision**: Executar `UPDATE events SET reserved_quantity = reserved_quantity + :qty WHERE id = :id AND state = 'PUBLISHED' AND capacity - sold_quantity - reserved_quantity >= :qty RETURNING ...`, criando a reserva na mesma transação. Aplicar constraints de não negatividade e `reserved_quantity + sold_quantity <= capacity`.

**Rationale**: PostgreSQL serializa writers da linha e reavalia o predicado; elimina a janela read-then-write e impede overselling inclusive em `READ COMMITTED`.

**Alternatives considered**: `SELECT` seguido de `UPDATE` sem lock (race); lock de tabela ou isolamento serializável global (mais contenção que o necessário); controle somente no ORM (defesa insuficiente no banco).

## Corrida entre expiração e pagamento

**Decision**: Aprovação, recusa e expiração fazem compare-and-set sobre `Reservation.status = PENDING` e validade temporal. Na mesma transação, aprovação move reservado para vendido e emite ingressos; recusa/expiração decrementam reservado. Ordem de locks é fixa e uma constraint única garante um pagamento por reserva/idempotency key.

**Rationale**: Somente uma transição terminal vence; não há emissão tardia, liberação dupla ou ingressos duplicados.

**Alternatives considered**: selecionar e depois atualizar (race); fila/worker obrigatório (fora do escopo); depender exclusivamente de cron (não garante liberação no próximo acesso).

## Validação de uso único

**Decision**: Verificar a credencial e executar `UPDATE tickets SET used_at = now(), used_by_id = :gate WHERE id = :id AND used_at IS NULL AND status = 'ACTIVE' RETURNING ...`. Se não retornar linha, reler de forma não mutante para produzir o resultado especificado.

**Rationale**: O banco arbitra scanners simultâneos e no máximo um recebe `VALID`; o log da tentativa é persistido na mesma transação.

**Alternatives considered**: ler e salvar depois (race); `SELECT FOR UPDATE` (correto, mas mais verboso); log único sem estado no ingresso (consulta e invariantes mais complexos).

## Credencial QR assinada e token compartilhado

**Decision**: Usar JWS compacto HS256 com segredo dedicado, allowlist de algoritmo, `kid`, versão, IDs, `iat` e nonce aleatório de ao menos 128 bits; o mesmo JWS é mostrado no QR e como código manual. Guardar hash do nonce. Criar share token opaco separado, também com ao menos 128 bits e armazenado como hash.

**Rationale**: Assinatura detecta adulteração, entropia impede enumeração e consulta online preserva revogação/uso único. Separar tokens evita que uma credencial pública de visualização seja aceita na portaria.

**Alternatives considered**: ID previsível (inseguro); um token para dois usos (confusão de privilégios); JWT stateless sem consulta ao banco (não impede reuso); assinatura assimétrica (desnecessária enquanto só o monólito valida online).

## JWT e autorização

**Decision**: Emitir access JWT HS256 de curta duração com `sub`, `role`, `iat`, `exp` e `jti`; segredo vem do ambiente. Hash de senha usa Argon2. Dependências FastAPI carregam o usuário ativo do banco, exigem papel e serviços verificam propriedade. Responder 401 para autenticação inválida e 403 para falta de permissão.

**Rationale**: Mantém autorização central no backend, invalida usuário desativado sem esperar expiração e oferece contrato Bearer padrão.

**Alternatives considered**: sessão server-side (estado adicional); confiar só no claim de papel (pode ficar obsoleto); scopes finos e refresh token (sem requisito no MVP).

## TMDb e snapshot

**Decision**: Encapsular TMDb em adapter HTTP backend com timeout, validação Pydantic e tentativas limitadas apenas para timeout/429/5xx. Ao selecionar, buscar detalhes e salvar snapshot normalizado (`tmdb_id`, título, sinopse, imagens opcionais, lançamento, idioma, gêneros e instante). Retornar 503 em indisponibilidade sem criar evento.

**Rationale**: Eventos publicados permanecem estáveis e operacionais sem o catálogo; campos ausentes têm fallback visual conforme `DESIGN.md`.

**Alternatives considered**: buscar por ID a cada leitura (frágil); guardar resposta inteira (acoplamento); cache/Redis (proibido); criar com dados parciais silenciosamente (inconsistente).

## Pagamento simulado determinístico

**Decision**: Uma porta interna `PaymentGateway` recebe apenas `tok_approved` ou `tok_declined`, exige `Idempotency-Key` e persiste a decisão. Aprovação confirma reserva e emite; recusa termina a reserva e libera inventário; outros tokens retornam validação inválida. Nenhum dado de cartão é aceito.

**Rationale**: Fluxos são reproduzíveis, seguros e testáveis, e retries não mudam nem duplicam o resultado.

**Alternatives considered**: decisão aleatória (testes instáveis); booleano de aprovação (contrato pouco realista); cartão fictício (incentiva coleta indevida); gateway real (fora de escopo).

## Frontend e linguagem visual

**Decision**: App Router com Server Components para páginas de leitura e Client Components nas fronteiras de câmera/formulário. Construir tokens CSS e componentes reutilizáveis de botão, ledger, ticket, status e perfuração a partir de `DESIGN.md`; screenshots em `docs/design` validam composição, sem importar o HTML Stitch.

**Rationale**: Mantém performance e consistência visual, evitando duplicação e dependência do código gerado.

**Alternatives considered**: copiar páginas HTML (viola regra e não cria sistema reutilizável); SPA totalmente client-side (JavaScript e estados desnecessários); biblioteca visual genérica sem adaptação (diverge da identidade).

## Testes e entrega

**Decision**: pytest unitário e integração com PostgreSQL real; testes concorrentes com transações/conexões independentes para últimas unidades, pagamento×expiração e 100 validações; Playwright cobre login CUSTOMER, descoberta, reserva, aprovação e Meus Ingressos. Compose é caminho local; Vercel hospeda web e Render hospeda API/PostgreSQL.

**Rationale**: SQLite não reproduz os locks usados pelo produto. Um E2E completo demonstra integração sem tornar toda a suíte dependente do navegador.

**Alternatives considered**: mocks para concorrência (não comprovam invariantes); SQLite (semântica diferente); muitos E2Es (lentos e frágeis); Kubernetes/Redis/broker (proibidos e sem necessidade).

## Clarifications status

Todas as escolhas técnicas necessárias ao plano foram resolvidas; não restam itens `NEEDS CLARIFICATION`.
