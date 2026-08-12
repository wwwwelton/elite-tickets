# Product Requirements Document — Elite Tickets

**Produto:** Elite Tickets
**Versão:** 1.0
**Status:** MVP / Desafio Elite Dev 2026
**Fonte de requisitos:** Desafio Elite Dev 2026
**Metodologia:** Spec-Driven Development (SDD)

---

# 1. Visão do Produto

Elite Tickets é uma plataforma web de eventos e ingressos que permite que:

* organizadores criem e publiquem eventos;
* clientes encontrem eventos publicados;
* clientes reservem ingressos;
* clientes realizem pagamentos simulados;
* o sistema gere ingressos digitais com QR Code;
* clientes compartilhem ingressos através de links;
* usuários de portaria validem ingressos na entrada dos eventos.

O objetivo do MVP é entregar um fluxo completo e funcional de ponta a ponta, priorizando simplicidade, clareza das decisões, qualidade do código e boa experiência de uso.

---

# 2. Problema

A plataforma deve resolver três necessidades principais.

## 2.1 Organizador

O organizador precisa conseguir transformar um item proveniente de um catálogo externo de shows ou filmes em um evento comercializável, definindo informações próprias como:

* data;
* local;
* capacidade;
* preço.

## 2.2 Cliente

O cliente precisa conseguir:

* descobrir eventos;
* consultar informações;
* reservar ingressos;
* realizar pagamento simulado;
* receber seu ingresso;
* visualizar seu QR Code;
* compartilhar o ingresso.

## 2.3 Portaria

A portaria precisa conseguir validar rapidamente um ingresso e identificar situações como:

* ingresso válido;
* ingresso inválido;
* ingresso já utilizado;
* ingresso pertencente a outro evento.

---

# 3. Objetivos do Produto

## OBJ-001 — Catálogo externo

Permitir que o organizador utilize informações provenientes de uma API externa de shows ou filmes como base para criação de eventos.

## OBJ-002 — Publicação de eventos

Permitir que organizadores criem e gerenciem eventos disponíveis aos clientes.

## OBJ-003 — Descoberta

Permitir que clientes naveguem pelos eventos publicados.

## OBJ-004 — Reserva

Permitir que clientes reservem ingressos respeitando a disponibilidade existente.

## OBJ-005 — Pagamento

Simular o processo de pagamento, incluindo cenários de aprovação e recusa.

## OBJ-006 — Emissão de ingresso

Gerar um ingresso digital após uma reserva e pagamento aprovados.

## OBJ-007 — QR Code seguro

Associar ao ingresso um código verificável através de QR Code que não possa ser facilmente forjado.

## OBJ-008 — Compartilhamento

Permitir que um ingresso seja compartilhado através de um link gerado pela aplicação.

## OBJ-009 — Validação

Permitir que a portaria valide o ingresso na entrada do evento.

## OBJ-010 — Controle de uso

Impedir que o mesmo ingresso seja utilizado mais de uma vez.

## OBJ-011 — Experiência de avaliação

Permitir que um avaliador execute e percorra o fluxo principal da aplicação sem necessidade de cadastrar manualmente todos os dados iniciais.

---

# 4. Personas e Papéis

O sistema MUST possuir três papéis distintos.

## 4.1 Organizador

Responsável por:

* consultar o catálogo externo;
* criar eventos;
* definir informações do evento;
* publicar eventos;
* gerenciar seus eventos.

## 4.2 Cliente

Responsável por:

* navegar por eventos;
* consultar eventos;
* reservar ingressos;
* realizar pagamento simulado;
* acessar seus ingressos;
* visualizar QR Code;
* compartilhar ingresso.

## 4.3 Portaria

Responsável por:

* identificar o evento;
* ler QR Code;
* informar código manualmente quando necessário;
* validar ingresso;
* registrar utilização do ingresso.

Os papéis MUST possuir permissões distintas.

---

# 5. Jornada Principal do Produto

O fluxo principal do MVP é:

```text
API externa
    ↓
Catálogo de shows/filmes
    ↓
Organizador
    ↓
Criação do evento
    ↓
Publicação
    ↓
Cliente
    ↓
Descoberta do evento
    ↓
Reserva
    ↓
Pagamento simulado
    ↓
Pagamento aprovado
    ↓
Ingresso
    ↓
QR Code
    ↓
Compartilhamento opcional
    ↓
Portaria
    ↓
Validação
    ↓
Ingresso utilizado
```

Este fluxo MUST funcionar de ponta a ponta antes da implementação de funcionalidades opcionais.

---

# 6. Requisitos de Produto

## PR-001 — Catálogo externo

O sistema MUST integrar-se com pelo menos uma das fontes externas permitidas pelo desafio:

* Ticketmaster Discovery API; ou
* TMDb API.

O catálogo externo deve fornecer a base para criação de eventos.

---

## PR-002 — Criação de evento

O Organizador MUST conseguir criar um evento baseado em um item proveniente do catálogo externo.

Durante a criação, MUST ser possível definir pelo menos:

* data;
* local;
* capacidade;
* preço.

---

## PR-003 — Gerenciamento de eventos

O Organizador MUST conseguir visualizar e gerenciar os eventos criados por ele.

---

## PR-004 — Publicação

Eventos criados pelo Organizador MUST poder ficar disponíveis para descoberta pelos clientes.

---

## PR-005 — Navegação

O Cliente MUST conseguir visualizar os eventos publicados.

Os eventos devem apresentar informações suficientes para decisão de compra, incluindo quando disponíveis:

* nome;
* data;
* local;
* preço;
* imagem.

---

## PR-006 — Busca

O Cliente MUST conseguir pesquisar eventos publicados.

Filtros adicionais MAY ser implementados como evolução do MVP.

---

## PR-007 — Detalhes do evento

O Cliente MUST conseguir abrir uma visualização detalhada de um evento.

A página SHOULD apresentar:

* nome;
* imagem;
* descrição;
* data;
* horário;
* local;
* preço;
* disponibilidade.

---

# 7. Reserva de ingressos

O desafio permite duas estratégias:

### Estratégia A — Lugar marcado

O Cliente seleciona um lugar através de um mapa de assentos.

Exemplos:

* cinema;
* teatro.

### Estratégia B — Quantidade

O Cliente seleciona uma quantidade de ingressos para um setor sem lugares individualizados.

Exemplo:

* pista.

O MVP MUST implementar pelo menos uma dessas estratégias.

## Decisão proposta para o MVP

Para reduzir complexidade e garantir a conclusão do fluxo completo dentro do prazo, o MVP SHOULD começar pela estratégia de **quantidade de ingressos**.

Mapa de assentos poderá ser implementado posteriormente como evolução.

---

# 8. Disponibilidade

## PR-008 — Controle de disponibilidade

O sistema MUST impedir que ingressos indisponíveis sejam vendidos.

No caso de lugares individualizados:

> o mesmo lugar MUST NOT ser vendido para duas reservas diferentes.

No modelo baseado em quantidade, a aplicação deve respeitar a capacidade disponível do evento.

---

# 9. Pagamento

## PR-009 — Pagamento simulado

A aplicação MUST possuir fluxo de pagamento.

Nenhuma transação financeira real é necessária.

O pagamento MUST possuir pelo menos os resultados:

```text
APPROVED
DECLINED
```

---

## PR-010 — Pagamento aprovado

Quando o pagamento for aprovado:

```text
Reserva
   ↓
Pagamento APPROVED
   ↓
Ingresso emitido
```

---

## PR-011 — Pagamento recusado

Quando o pagamento for recusado:

* o usuário MUST receber indicação clara da recusa;
* o sistema MUST NOT emitir um ingresso válido.

---

# 10. Ingressos

## PR-012 — Emissão

Após o pagamento aprovado, o Cliente MUST receber um ingresso associado:

* ao cliente;
* ao evento;
* à reserva.

---

## PR-013 — Meus Ingressos

O Cliente MUST possuir uma área chamada **Meus Ingressos** ou equivalente.

Ela MUST permitir visualizar os ingressos adquiridos.

---

## PR-014 — QR Code

Cada ingresso MUST possuir QR Code próprio.

O QR Code deve representar um identificador verificável pela aplicação.

A solução MUST ser projetada de forma que simplesmente alterar os dados apresentados no QR Code não permita criar um ingresso válido.

---

# 11. Compartilhamento

## PR-015 — Compartilhamento por link

O Cliente MUST conseguir gerar ou acessar um link que permita compartilhar seu ingresso.

O sistema MUST identificar o ingresso correspondente sem expor informações sensíveis ou permitir falsificação trivial.

---

# 12. Portaria

## PR-016 — Tela de validação

O papel Portaria MUST possuir uma interface específica para validação de ingressos.

---

## PR-017 — Leitura por câmera

A aplicação MUST permitir leitura do QR Code através da câmera do dispositivo.

---

## PR-018 — Entrada manual

Quando a câmera não puder ser utilizada, o usuário da Portaria MUST conseguir informar manualmente o código do ingresso.

---

# 13. Resultado da validação

A validação MUST produzir resultados claros.

## VALID

O ingresso:

* existe;
* corresponde ao evento;
* ainda não foi utilizado;
* pode ser aceito.

Após a validação, o ingresso deverá ser registrado como utilizado.

---

## INVALID

O código não corresponde a um ingresso válido.

---

## ALREADY_USED

O ingresso já foi utilizado anteriormente.

A entrada MUST ser recusada.

---

## WRONG_EVENT

O ingresso é válido, mas pertence a outro evento.

A entrada MUST ser recusada.

---

# 14. Idempotência da validação

## PR-019 — Uso único

Um ingresso MUST NOT ser validado com sucesso duas vezes.

Exemplo:

```text
Primeira leitura
QR → VALID
     ↓
ticket = USED

Segunda leitura
QR → ALREADY_USED
```

---

# 15. Autenticação e autorização

## PR-020 — Autenticação

A aplicação MUST possuir autenticação.

---

## PR-021 — Autorização baseada em papel

O sistema MUST distinguir:

```text
ORGANIZER
CUSTOMER
GATE
```

Cada papel MUST possuir acesso somente às operações correspondentes às suas responsabilidades.

---

# 16. Persistência

O sistema MUST persistir pelo menos:

```text
Users
Events
Reservations
Tickets
```

Informações necessárias ao pagamento simulado e validação MAY utilizar entidades adicionais.

---

# 17. Regras de Negócio

## BR-001

Somente Organizador pode criar ou gerenciar eventos.

## BR-002

Somente Cliente pode realizar uma reserva para aquisição de ingresso.

## BR-003

Um ingresso somente pode ser emitido após um pagamento aprovado.

## BR-004

Pagamento recusado não gera ingresso válido.

## BR-005

O mesmo lugar MUST NOT ser vendido duas vezes quando houver lugar marcado.

## BR-006

Uma reserva não pode exceder a disponibilidade do evento.

## BR-007

Cada ingresso possui um identificador único.

## BR-008

Um ingresso somente pode ser validado para seu respectivo evento.

## BR-009

Um ingresso utilizado não pode voltar ao estado válido através do fluxo normal.

## BR-010

Um ingresso já utilizado não pode ser validado novamente.

## BR-011

O sistema MUST NOT confiar exclusivamente em informações modificáveis pelo cliente para determinar a validade do ingresso.

---

# 18. Estados principais

## Evento

```text
DRAFT
PUBLISHED
```

Estados adicionais MAY ser introduzidos posteriormente.

## Reserva

```text
PENDING
CONFIRMED
CANCELLED
```

## Pagamento

```text
PENDING
APPROVED
DECLINED
```

## Ingresso

```text
VALID
USED
```

Esses estados representam uma proposta de modelagem do produto e devem ser confirmados nas respectivas specs antes da implementação.

---

# 19. Restrições técnicas impostas pelo desafio

Diferentemente de decisões técnicas comuns, estas tecnologias fazem parte explicitamente das restrições do desafio.

## Frontend

MUST utilizar **React**.

Pode utilizar, por exemplo:

* Next.js;
* Vite;
* Remix;
* outro framework baseado em React.

## Backend

MUST utilizar uma das seguintes linguagens:

* Node.js;
* Python;
* Java.

O framework pode ser escolhido pelo projeto.

## Banco de Dados

A aplicação MUST utilizar banco de dados.

A configuração e utilização do banco MUST estar documentadas no README.

---

# 20. Decisões técnicas específicas

Escolhas como:

```text
Next.js
FastAPI
PostgreSQL
Docker Compose
JWT
SQLAlchemy
pytest
Playwright
```

não devem ser tratadas automaticamente como requisitos de produto.

Quando escolhidas, devem ser justificadas em:

```text
plan.md
research.md
ADR
```

exceto quando diretamente impostas pelo desafio.

---

# 21. Dados de demonstração

A aplicação MUST possuir dados iniciais suficientes para permitir avaliação sem configuração manual de todo o sistema.

Devem existir pelo menos:

```text
1 Organizador
2 Clientes
1 usuário de Portaria
1 evento publicado
Ingressos disponíveis
```

Os dados de acesso necessários para demonstração SHOULD estar claramente documentados no README.

---

# 22. Documentação

O repositório MUST possuir um README detalhado contendo:

* visão geral;
* requisitos;
* configuração;
* variáveis de ambiente;
* configuração do banco;
* instalação;
* execução;
* dados de demonstração;
* testes;
* limitações conhecidas.

Se alguma funcionalidade esperada não estiver funcionando, isso MUST ser explicitamente documentado.

---

# 23. Uso de Inteligência Artificial

O projeto pode utilizar ferramentas de IA durante o desenvolvimento.

O repositório SHOULD documentar:

* ferramentas de IA utilizadas;
* etapas em que foram utilizadas;
* decisões sugeridas pela IA;
* decisões modificadas ou rejeitadas pelo desenvolvedor;
* partes realizadas sem IA.

Artefatos gerados durante o processo de desenvolvimento SHOULD permanecer versionados quando ajudarem a demonstrar o processo decisório.

Isso inclui, quando existentes:

```text
PRD
constitution
specs
plans
tasks
ADRs
documentos de contexto
```

---

# 24. Requisitos de experiência

A interface SHOULD possuir identidade visual própria.

O projeto SHOULD evitar interfaces genéricas produzidas automaticamente sem justificativa de decisões de design.

Decisões relevantes de UX/UI SHOULD possuir intenção clara e, quando apropriado, ser documentadas.

---

# 25. Critérios de Sucesso do MVP

O MVP será considerado funcional quando for possível executar este fluxo:

```text
1. autenticar como Organizador
        ↓
2. consultar catálogo externo
        ↓
3. criar evento
        ↓
4. publicar evento
        ↓
5. autenticar como Cliente
        ↓
6. encontrar evento
        ↓
7. reservar ingresso
        ↓
8. realizar pagamento simulado
        ↓
9. receber ingresso
        ↓
10. visualizar QR
        ↓
11. compartilhar ingresso
        ↓
12. autenticar como Portaria
        ↓
13. ler QR
        ↓
14. validar ingresso
        ↓
15. tentar validar novamente
        ↓
16. receber ALREADY_USED
```

O fluxo ponta a ponta tem prioridade sobre funcionalidades adicionais.

---

# 26. Escopo obrigatório do MVP

O MVP inclui:

* autenticação;
* três papéis;
* integração com Ticketmaster ou TMDb;
* criação de evento;
* gerenciamento básico de eventos;
* publicação;
* navegação;
* busca;
* reserva;
* controle de disponibilidade;
* pagamento simulado;
* aprovação de pagamento;
* recusa de pagamento;
* emissão de ingresso;
* QR Code;
* Meus Ingressos;
* compartilhamento por link;
* tela de portaria;
* leitura de QR pela câmera;
* entrada manual do código;
* validação do ingresso;
* prevenção de utilização duplicada;
* persistência;
* dados iniciais;
* README.

---

# 27. Funcionalidades opcionais

Depois que o fluxo obrigatório estiver completo, podem ser adicionados:

* filtros avançados;
* painel mais completo do organizador;
* cancelamento;
* devolução de disponibilidade;
* mapa de assentos em tempo real;
* Docker Compose;
* testes adicionais;
* deploy público.

Essas funcionalidades MUST NOT comprometer a conclusão do fluxo principal.

---

# 28. Fora do Escopo

Não é necessário implementar:

* nota fiscal;
* revenda de ingressos entre usuários;
* aplicativo mobile nativo;
* recuperação de senha;
* envio de ingresso por e-mail.

O projeto também não necessita processar cobrança financeira real.

---

# 29. Deploy

Deploy público não é obrigatório para o funcionamento do produto.

Entretanto, a publicação da aplicação é desejável para facilitar sua avaliação.

A aplicação MAY ser publicada em:

```text
Vercel
ou plataforma equivalente
```

---

# 30. Qualidade e avaliação

O projeto deve privilegiar:

* fluxo completo;
* código organizado;
* tratamento de erros;
* interface agradável;
* documentação;
* decisões justificáveis;
* histórico de versionamento;
* testes básicos.

Complexidade adicional não deve ser priorizada sobre um fluxo simples funcionando corretamente.

---

# 31. Rastreabilidade SDD

O PRD representa a visão e os requisitos de nível de produto.

Cada feature relevante deve possuir uma especificação correspondente.

Exemplo:

```text
PRD
│
├── PR-001 Catálogo
│      └── specs/001-ticket-platform-mvp/
│
├── PR-002 Criação de eventos
│
├── PR-007 Reserva
│
├── PR-009 Pagamento
│
├── PR-012 Ingresso
│
├── PR-015 Compartilhamento
│
└── PR-016 Portaria
```

Para o MVP, uma única feature inicial pode abranger o fluxo completo:

```text
specs/
└── 001-ticket-platform-mvp/
    ├── spec.md
    ├── plan.md
    ├── research.md
    ├── data-model.md
    ├── contracts/
    ├── quickstart.md
    └── tasks.md
```

A `spec.md` MUST referenciar os requisitos deste PRD que ela implementa.

Exemplo:

```text
PRD References:
- OBJ-001
- OBJ-002
- OBJ-003
- OBJ-004
- OBJ-005
- OBJ-006
- OBJ-007
- OBJ-008
- OBJ-009
- OBJ-010

Product Requirements:
- PR-001
- PR-002
- PR-004
- PR-005
- PR-007
- PR-009
- PR-012
- PR-014
- PR-015
- PR-016
- PR-019
```

---

# 32. Hierarquia documental

O projeto utiliza a seguinte hierarquia:

```text
constitution.md
       │
       ▼
     PRD.md
       │
       ▼
    spec.md
       │
       ▼
    plan.md
       │
       ▼
   tasks.md
       │
       ▼
     código
       │
       ▼
     testes
```

### Constitution

Define princípios e regras globais.

### PRD

Define o produto, problema, usuários, objetivos e requisitos de produto.

### Spec

Define exatamente o comportamento esperado de uma feature.

### Plan

Define como a feature será implementada tecnicamente.

### Tasks

Divide a solução em trabalho executável.

### Código e testes

Implementam e verificam o comportamento especificado.

---

# 33. Princípio de priorização

Quando houver conflito entre adicionar sofisticação e terminar o fluxo principal, o projeto MUST priorizar:

> **um fluxo simples, completo, demonstrável e bem explicado de ponta a ponta.**

Funcionalidades adicionais somente devem ser priorizadas depois que o fluxo obrigatório estiver funcional.
