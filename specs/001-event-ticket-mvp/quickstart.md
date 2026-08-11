# Quickstart & Validation Guide

Este guia define como provar o MVP após a implementação. Consulte [data-model.md](data-model.md) para invariantes e [contracts/openapi.yaml](contracts/openapi.yaml) para o contrato HTTP.

## Prerequisites

- Docker Engine com Docker Compose v2
- Node.js 22 LTS apenas para execução fora do container
- Uma chave TMDb válida para pesquisa do organizador
- Portas locais do frontend, API e PostgreSQL livres conforme `.env.example`

Copie `.env.example` para `.env` e preencha somente valores locais. Use segredos distintos para JWT e QR. Nunca versione `.env`.

## Start locally

```bash
docker compose up --build -d
docker compose run --rm api alembic upgrade head
docker compose run --rm api python -m elite_tickets.seed_demo
docker compose ps
```

Expected:

- PostgreSQL fica healthy antes da API.
- `/health/live` e `/health/ready` respondem com sucesso.
- frontend abre a home e lista ao menos um evento publicado sem depender de uma chamada TMDb em leitura.
- o seed pode ser repetido sem duplicar contas ou eventos.

As credenciais de ORGANIZER, CUSTOMER e GATE e os tokens `tok_approved`/`tok_declined` devem ser documentados pela implementação em dados de demonstração, nunca como segredos reais.

## Automated validation

```bash
docker compose run --rm api pytest
docker compose run --rm web npm test
docker compose run --rm web npm run test:e2e
```

Expected:

- pytest cobre matriz de autorização/propriedade, validações de evento, snapshot do TMDb, reserva/expiração, pagamento e emissão, assinatura adulterada, share token e todos os resultados GATE.
- testes críticos usam PostgreSQL, conexões independentes e não são substituídos por SQLite/mocks.
- Playwright executa ao menos Chromium e conclui o fluxo CUSTOMER pela UI.

## Critical concurrency proofs

Execute separadamente para facilitar diagnóstico (marcadores finais podem ser ajustados na implementação):

```bash
docker compose run --rm api pytest -m concurrency -v
```

Expected:

1. Solicitações simultâneas pelas últimas unidades aprovam no máximo a capacidade; `reserved + sold <= capacity` e disponibilidade nunca é negativa.
2. Pagamento concorrente com expiração produz exatamente um estado terminal, sem emissão tardia nem liberação dupla.
3. Cem validações simultâneas do mesmo ingresso produzem exatamente um `VALID`; as demais aplicáveis produzem `ALREADY_USED`.

## Manual role walkthrough

### ORGANIZER

1. Autentique a conta de demonstração ORGANIZER.
2. Pesquise um filme no TMDb, selecione-o, informe local, início/fim, capacidade e preço.
3. Verifique que o evento nasce `DRAFT`; publique-o e confirme que aparece na vitrine.
4. Interrompa/bloqueie o TMDb e confirme que pesquisa falha com retry, enquanto o evento existente mantém poster/título pelo snapshot.

### CUSTOMER — main browser E2E

1. Autentique CUSTOMER, localize e abra o evento publicado.
2. Reserve duas unidades e confirme o prazo de 15 minutos.
3. Pague com `tok_approved` e uma `Idempotency-Key` nova; repita a mesma requisição e confirme que não duplica ingressos.
4. Abra Meus Ingressos, veja dois ingressos e confira que QR e código textual representam a mesma credencial.
5. Gere link público e abra em contexto anônimo; a visualização não oferece ações de proprietário.
6. Em outra reserva, use `tok_declined`; confirme zero ingressos e estoque liberado.

### GATE

1. Autentique GATE e selecione o evento publicado.
2. Valide a credencial por scanner ou entrada manual: primeira tentativa retorna `VALID`.
3. Repita: retorna `ALREADY_USED`; o link compartilhado agora retorna expirado.
4. Teste credencial adulterada (`INVALID`) e credencial válida de outro evento (`WRONG_EVENT`) sem consumir essa credencial.
5. Desconecte a API: a UI informa indisponibilidade e nunca apresenta aceite offline.

## Cancellation and temporal behavior

- Cancele um evento publicado próprio: novas reservas e validações falham, pendências passam a `CANCELLED`, inventário é liberado e ingressos permanecem visíveis como cancelados.
- Use relógio controlado nos testes para avançar além de `ends_at`: o evento é observado como `FINISHED`, não aceita reserva/validação e shares expiram.
- Avance além de `reservation.expires_at`: a primeira operação relevante aplica expiração atomicamente e pagamento posterior não emite.
- Confirme nos logs/estado do Compose que o runner de expiração, baseado na mesma imagem da API, executa ao menos uma vez por minuto e libera reservas vencidas sem operação manual.

## Production smoke checks

Sempre valide estaticamente em `infra/render.yaml` que o comando idempotente de expiração está agendado ao menos uma vez por minuto. Quando houver acesso ao ambiente implantado, registre também as seguintes evidências de smoke; ausência desse acesso deve ser registrada como “não executado”, sem bloquear as validações locais:

- Vercel aponta para a URL HTTPS da API Render e CORS permite somente origens esperadas.
- Render executou `alembic upgrade head` no pre-deploy e `/health/ready` está saudável.
- O comando idempotente de expiração executa no Render ao menos uma vez por minuto sem liberação duplicada.
- `DATABASE_URL`, TMDb, JWT e chave QR estão apenas nos ambientes das plataformas e JWT/QR usam segredos distintos.
- O frontend não expõe credencial TMDb nem aceita token compartilhado no fluxo GATE.
- Respostas de links compartilhados enviam `Cache-Control: no-store` e `Referrer-Policy: no-referrer`, inclusive para links inexistentes ou expirados.
