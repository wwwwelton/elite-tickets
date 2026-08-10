<!--
Relatório de Impacto da Sincronização
- Alteração de versão: template sem versão → 1.0.0
- Princípios modificados: nenhum; ratificação inicial
- Princípios adicionados: I. Fluxo Principal Ponta a Ponta; II. Regras Críticas no
  Backend; III. Autorização por Papéis; IV. Capacidade Nunca Negativa;
  V. Reservas Concorrentes sem Overselling; VI. Validação Única de Ingresso;
  VII. QR Code Não Falsificável por ID; VIII. Testes de Funcionalidades Críticas;
  IX. Simplicidade e Legibilidade; X. Execução Local com Docker Compose;
  XI. Modo de Demonstração; XII. Proteção de Credenciais e Segredos;
  XIII. Decisões Arquiteturais Documentadas; XIV. Identidade Visual Não Genérica;
  XV. DESIGN.md como Fonte Visual; XVI. spec.md como Fonte Funcional;
  XVII. plan.md como Fonte Técnica; XVIII. Verificação de Código Gerado por IA
- Seções adicionadas: Restrições de Engenharia; Fluxo de Desenvolvimento
- Seções removidas: nenhuma
- TODOs pendentes: nenhum
-->
# Constituição do EliteTickets

## Core Principles

### I. Fluxo Principal Ponta a Ponta
O fluxo principal de descoberta do evento, reserva ou compra, emissão do ingresso
e validação na entrada DEVE funcionar ponta a ponta antes da implementação de
funcionalidades opcionais. O planejamento e a priorização DEVEM favorecer um
produto integrado e demonstrável em vez de amplitude incompleta.

### II. Regras Críticas no Backend
Regras de negócio críticas DEVEM residir e ser aplicadas no backend. O frontend
PODE orientar a experiência, mas suas verificações NUNCA substituem validações do
servidor. Isso mantém as regras consistentes e impede que clientes manipulados as
contornem.

### III. Autorização por Papéis
Toda operação protegida DEVE ser autorizada no backend por um dos papéis
`ORGANIZER`, `CUSTOMER` ou `GATE`. Endpoints DEVEM negar por padrão ações sem
permissão explícita, e o frontend NÃO DEVE ser tratado como fronteira de segurança.

### IV. Capacidade Nunca Negativa
A capacidade disponível de um evento NUNCA DEVE ficar negativa. Toda alteração de
inventário DEVE preservar esse invariante no banco de dados, inclusive diante de
falhas, repetições e concorrência.

### V. Reservas Concorrentes sem Overselling
Reservas concorrentes NÃO DEVEM vender mais ingressos do que a capacidade do
evento. A verificação e a redução do inventário DEVEM ocorrer atomicamente, com
mecanismo transacional ou restrição equivalente comprovada por testes concorrentes.

### VI. Validação Única de Ingresso
Um ingresso NUNCA DEVE ser consumido mais de uma vez. A transição para o estado
validado DEVE ser atômica e idempotente quanto ao resultado: tentativas posteriores
DEVEM ser recusadas e não podem registrar uma nova entrada.

### VII. QR Code Não Falsificável por ID
O QR Code NÃO DEVE conceder acesso com base apenas em identificador previsível.
Seu conteúdo DEVE possuir entropia suficiente ou proteção criptográfica verificável
pelo backend, de modo que alterar ou enumerar um ID não produza ingresso válido.

### VIII. Testes de Funcionalidades Críticas
Funcionalidades críticas DEVEM possuir testes automatizados. No mínimo, autorização,
limites de capacidade, concorrência de reservas, emissão e validação única de
ingressos e verificação de QR Code DEVEM ter testes que cubram sucesso e falha.

### IX. Simplicidade e Legibilidade
O código DEVE ser simples, legível e facilmente explicável. Abstrações, serviços,
filas, caches ou outros componentes adicionais somente PODEM ser introduzidos
quando um requisito ou evidência técnica demonstrar sua necessidade.

### X. Execução Local com Docker Compose
O projeto completo DEVE iniciar localmente por meio do Docker Compose, incluindo
frontend, backend, PostgreSQL e migrações necessárias. As instruções de execução
DEVEM ser reproduzíveis sem configuração manual não documentada.

### XI. Modo de Demonstração
DEVE existir um modo de demonstração com dados previamente semeados que permita
percorrer o fluxo principal e representar os três papéis. A carga DEVE ser
reproduzível e não pode depender de credenciais reais ou dados sensíveis.

### XII. Proteção de Credenciais e Segredos
Credenciais, tokens, chaves e segredos NUNCA DEVEM ser versionados. O repositório
DEVE fornecer somente exemplos seguros de configuração; valores reais DEVEM ser
injetados pelo ambiente ou por mecanismo local não rastreado.

### XIII. Decisões Arquiteturais Documentadas
Decisões arquiteturais importantes DEVEM registrar contexto, alternativas,
consequências e justificativa em documentação versionada. Uma mudança que invalide
uma decisão anterior DEVE atualizar ou substituir explicitamente seu registro.

### XIV. Identidade Visual Não Genérica
A interface DEVE evitar padrões visuais genéricos associados a aplicações geradas
por IA. Componentes e páginas DEVEM seguir uma direção intencional, coerente com a
marca, o conteúdo e os estados reais do produto.

### XV. DESIGN.md como Fonte Visual
`DESIGN.md` DEVE ser a fonte da verdade para direção visual, incluindo linguagem,
composição, tipografia, cores e padrões de interface. Divergências visuais DEVEM ser
resolvidas atualizando a implementação ou, mediante decisão explícita, o documento.
Esse arquivo NÃO define a arquitetura da aplicação.

### XVI. spec.md como Fonte Funcional
`spec.md` DEVE ser a fonte da verdade para o comportamento funcional de cada
funcionalidade. Toda mudança observável de comportamento DEVE corresponder a um
requisito ou cenário documentado na especificação antes de ser considerada pronta.

### XVII. plan.md como Fonte Técnica
`plan.md` DEVE ser a fonte da verdade para decisões técnicas da funcionalidade,
incluindo arquitetura, modelos, contratos e estratégia de implementação. Mudanças
técnicas materiais durante a execução DEVEM ser refletidas no plano.

### XVIII. Verificação de Código Gerado por IA
Código gerado por IA DEVE ser executado, revisado e testado antes de qualquer
commit. A autoria assistida NÃO reduz os critérios de qualidade nem substitui a
responsabilidade humana de compreender e validar a alteração.

## Restrições de Engenharia

- A solução DEVE usar Next.js, React e TypeScript no frontend; Python e FastAPI no
  backend; PostgreSQL, SQLAlchemy e Alembic para persistência e migrações.
- A autenticação DEVE usar JWT e a autorização DEVE respeitar o Princípio III.
- Operações de inventário e consumo de ingresso DEVEM usar garantias do banco de
  dados adequadas aos invariantes dos Princípios IV, V e VI.
- Integrações externas, incluindo TMDb, DEVEM ter falhas tratadas sem comprometer o
  fluxo crítico ou a integridade dos dados.
- Microserviços, filas e caches NÃO DEVEM ser introduzidos sem requisito comprovado
  e decisão arquitetural documentada.

## Fluxo de Desenvolvimento

1. Definir comportamento e critérios verificáveis em `spec.md`.
2. Registrar decisões técnicas e riscos em `plan.md`.
3. Dividir a entrega priorizando o fluxo ponta a ponta.
4. Implementar regras críticas no backend e controles de experiência no frontend.
5. Executar testes automatizados, incluindo cenários negativos e concorrentes
   aplicáveis, e validar o ambiente Docker Compose.
6. Revisar a aderência a `DESIGN.md`, à especificação, ao plano e a esta
   constituição antes do commit.

Uma mudança somente PODE ser considerada concluída quando seus critérios da
especificação estiverem demonstravelmente atendidos, os testes críticos passarem e
a documentação afetada estiver sincronizada.

## Governance

Esta constituição prevalece sobre práticas, convenções e decisões conflitantes do
projeto. Toda revisão de especificação, plano ou código DEVE verificar sua
conformidade. Exceções não podem ser implícitas: DEVEM registrar escopo, motivo,
risco, responsável e prazo de remoção em decisão arquitetural versionada.

Emendas DEVEM ser propostas com justificativa e relatório de impacto, revisadas
quanto aos artefatos dependentes e aprovadas antes de entrarem em vigor. A versão
segue SemVer: MAJOR para remoções ou redefinições incompatíveis de governança;
MINOR para novos princípios, seções ou expansão material; PATCH para
esclarecimentos sem mudança normativa. A data da última emenda DEVE acompanhar
toda alteração aprovada.

Revisões e entregas DEVEM demonstrar conformidade com evidências proporcionais ao
risco, como testes, execução local e documentação. Complexidade adicional DEVE ser
justificada contra o Princípio IX. Violações bloqueiam a conclusão da mudança até
serem corrigidas ou formalmente tratadas pelo processo de exceção.

**Version**: 1.0.0 | **Ratified**: 2026-08-10 | **Last Amended**: 2026-08-10
