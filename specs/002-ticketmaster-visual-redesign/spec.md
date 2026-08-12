# Feature Specification: Catálogo Ticketmaster e evolução visual

**Feature Branch**: `002-ticketmaster-visual-redesign`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "Substituir o catálogo externo atual pela Ticketmaster Discovery API e reconstruir a experiência visual do frontend usando os artefatos de design aprovados do projeto, preservando os fluxos existentes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar evento a partir do catálogo Ticketmaster (Priority: P1)

Como ORGANIZER autenticado, quero pesquisar shows e eventos por palavra-chave, reconhecer um item pelos seus dados básicos, selecioná-lo e usá-lo como origem de conteúdo para criar meu próprio evento EliteTickets, mantendo sob meu controle data, horário, local, capacidade e preço.

**Why this priority**: Esta jornada entrega o objetivo comercial principal da evolução: trocar a origem externa sem retirar do organizador o controle operacional do evento vendido na plataforma.

**Independent Test**: Pode ser testada pesquisando uma palavra-chave que tenha resultados, selecionando um item, preenchendo todos os dados operacionais e confirmando que o novo evento aparece no gerenciamento com os valores definidos pelo organizador.

**Acceptance Scenarios**:

1. **Given** um ORGANIZER autenticado e o catálogo disponível, **When** ele pesquisa uma palavra-chave válida, **Then** visualiza resultados da Ticketmaster com título, imagem quando disponível, categoria quando disponível e informações básicas suficientes para distinguir os itens.
2. **Given** resultados de pesquisa visíveis, **When** o ORGANIZER seleciona um item, **Then** o item fica identificado como origem e o formulário de criação solicita data, horário, local, capacidade e preço próprios do evento EliteTickets.
3. **Given** um item externo selecionado e todos os dados operacionais válidos, **When** o ORGANIZER confirma a criação, **Then** o evento EliteTickets é criado com o conteúdo de origem preservado e com os dados operacionais informados pelo organizador.
4. **Given** dados operacionais conflitantes com informações apresentadas pelo catálogo, **When** o ORGANIZER cria o evento, **Then** prevalecem data, horário, local, capacidade e preço configurados no EliteTickets.
5. **Given** um usuário CUSTOMER ou GATE autenticado, **When** tenta pesquisar ou selecionar itens do catálogo para criação, **Then** a operação é negada sem revelar credenciais ou detalhes protegidos do provedor.

---

### User Story 2 - Usar eventos criados durante indisponibilidade externa (Priority: P1)

Como usuário da plataforma, quero continuar encontrando, comprando, gerenciando ou validando ingressos de eventos EliteTickets já criados quando o catálogo externo estiver indisponível, para que uma falha de terceiro não interrompa a operação principal.

**Why this priority**: A continuidade de vendas, gestão e portaria é crítica e não pode depender da disponibilidade de um catálogo usado apenas na criação.

**Independent Test**: Pode ser testada criando previamente um evento a partir de um item externo, simulando a indisponibilidade do provedor e percorrendo os fluxos de detalhes, reserva, checkout, gerenciamento e validação desse evento.

**Acceptance Scenarios**:

1. **Given** um evento EliteTickets criado a partir de um item externo, **When** o provedor fica indisponível, **Then** título, imagem, categoria e identificação externa preservados continuam disponíveis sem uma nova consulta externa.
2. **Given** o catálogo externo indisponível, **When** CUSTOMER, ORGANIZER ou GATE utiliza um evento já armazenado, **Then** os fluxos autorizados desse evento continuam funcionando sem degradação causada pela falha externa.
3. **Given** uma falha durante uma nova pesquisa, **When** o ORGANIZER navega para seus eventos existentes, **Then** a navegação e o gerenciamento permanecem disponíveis.

---

### User Story 3 - Entender os estados da pesquisa externa (Priority: P2)

Como ORGANIZER, quero receber estados claros e distintos durante a pesquisa no catálogo para saber se devo aguardar, mudar os termos, corrigir a configuração ou tentar novamente mais tarde.

**Why this priority**: Mensagens acionáveis evitam que falhas operacionais sejam confundidas com ausência de resultados e reduzem tentativas improdutivas.

**Independent Test**: Pode ser testada provocando separadamente carregamento, resposta vazia, falha geral, credencial/configuração inválida e limitação temporária, verificando a mensagem e a ação oferecida em cada caso.

**Acceptance Scenarios**:

1. **Given** uma pesquisa em andamento, **When** a resposta ainda não chegou, **Then** a interface apresenta estado de carregamento e evita submissões duplicadas acidentais.
2. **Given** uma pesquisa concluída sem correspondências, **When** a resposta é exibida, **Then** a interface informa que não há resultados e permite ajustar a palavra-chave.
3. **Given** uma falha geral do provedor, **When** a pesquisa não pode ser concluída, **Then** a interface apresenta erro externo e oferece nova tentativa sem afetar outras áreas.
4. **Given** credenciais ausentes, inválidas ou configuração rejeitada, **When** o ORGANIZER pesquisa, **Then** a interface apresenta um estado de configuração/autenticação distinto, sem expor valores sensíveis.
5. **Given** o limite temporário de requisições atingido, **When** uma pesquisa é recusada, **Then** a interface identifica a limitação temporária, desestimula tentativas imediatas repetidas e permite tentar novamente posteriormente.

---

### User Story 4 - Percorrer os fluxos em uma experiência visual coerente (Priority: P2)

Como CUSTOMER, ORGANIZER ou GATE, quero utilizar as principais telas em uma linguagem visual consistente com a identidade aprovada do EliteTickets, com hierarquia, composição, espaçamento, interação e responsividade adequados à minha tarefa.

**Why this priority**: O redesign deve tornar o produto reconhecível como uma experiência de eventos e ingressos sem sacrificar os fluxos funcionais existentes.

**Independent Test**: Pode ser testada por revisão visual e funcional das principais telas em larguras móvel e desktop, comparando-as com DESIGN.md e as referências aprovadas e concluindo uma jornada principal de cada papel.

**Acceptance Scenarios**:

1. **Given** um CUSTOMER em dispositivo móvel, **When** percorre autenticação, eventos, detalhes, quantidade, reserva, checkout, resultados de pagamento, Meus Ingressos, QR Code e compartilhamento, **Then** todas as ações permanecem acessíveis, legíveis e funcionais em uma composição mobile-first.
2. **Given** um ORGANIZER em desktop ou tela menor, **When** percorre autenticação, catálogo, seleção, criação e gerenciamento, **Then** encontra uma experiência responsiva, com estoque vendido e disponível claramente legíveis.
3. **Given** um GATE durante a operação de entrada, **When** seleciona evento e valida por QR ou entrada manual, **Then** consegue distinguir rapidamente os resultados VALID, INVALID, ALREADY_USED e WRONG_EVENT.
4. **Given** qualquer tela principal reconstruída, **When** ela é comparada aos artefatos aprovados, **Then** preserva a linguagem editorial de ingressos, eventos, cartazes e cinema/show, sem adotar aparência genérica de painel administrativo.

---

### User Story 5 - Preservar regras críticas existentes (Priority: P1)

Como responsável pelo negócio, quero que a troca de catálogo e o redesign não alterem autorização, reservas, estoque, pagamentos, emissão, compartilhamento e validação de ingressos, para evoluir o produto sem introduzir regressões críticas.

**Why this priority**: Integridade de inventário, acesso autorizado e entrada única são invariantes do produto e bloqueiam a entrega se forem quebrados.

**Independent Test**: Pode ser testada executando os cenários automatizados existentes e os fluxos ponta a ponta dos três papéis após a evolução, incluindo falhas, concorrência e repetição de validação.

**Acceptance Scenarios**:

1. **Given** reservas concorrentes próximas ao limite, **When** são processadas após a evolução, **Then** o estoque nunca fica negativo e não ocorre venda acima da capacidade.
2. **Given** um ingresso já utilizado, **When** uma nova validação é tentada, **Then** o resultado permanece ALREADY_USED e nenhuma segunda entrada é registrada.
3. **Given** um QR adulterado, previsível ou pertencente a outro evento, **When** é validado, **Then** não concede entrada e retorna o resultado aplicável.
4. **Given** uma ação protegida, **When** é tentada por um papel sem permissão, **Then** continua sendo negada independentemente do que a interface exiba.

### Edge Cases

- Uma palavra-chave vazia ou composta apenas por espaços não inicia uma pesquisa e orienta o ORGANIZER a informar um termo.
- Resultados sem imagem ou categoria continuam selecionáveis e usam uma apresentação substituta que não inventa conteúdo externo.
- Itens com títulos iguais permanecem distinguíveis por outras informações básicas disponíveis na origem.
- Uma resposta externa lenta mantém o estado de carregamento compreensível e permite que o usuário abandone a pesquisa e navegue pelo produto.
- Uma resposta externa incompleta ou malformada não cria evento parcial e não derruba a tela de pesquisa.
- Uma nova tentativa após erro não duplica o evento nem reaproveita silenciosamente uma seleção inválida.
- Se o item externo deixar de existir ou mudar depois da criação, a cópia preservada no evento EliteTickets não é apagada nem alterada automaticamente.
- Perda de autenticação durante pesquisa, seleção ou criação solicita nova autenticação e não expõe dados protegidos.
- Valores inválidos de capacidade ou preço e data/horário inválidos continuam sujeitos às validações existentes de criação do evento.
- Textos extensos, imagens em proporções variadas, ausência de conteúdo opcional e diferentes tamanhos de tela não ocultam ações essenciais.
- Falhas do catálogo durante checkout ou validação de portaria não interferem nesses fluxos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST substituir o catálogo externo anterior pelo catálogo Ticketmaster como fonte disponível para novas pesquisas e seleções de conteúdo por ORGANIZER.
- **FR-002**: O sistema MUST permitir somente a ORGANIZER autenticado pesquisar o catálogo externo por palavra-chave.
- **FR-003**: Cada resultado MUST apresentar título e informações básicas de identificação, além de imagem e categoria quando fornecidas pela origem.
- **FR-004**: O ORGANIZER MUST poder selecionar exatamente um resultado de pesquisa como origem de conteúdo para a criação de um evento EliteTickets.
- **FR-005**: Após a seleção, o sistema MUST exigir que o ORGANIZER defina data, horário, local, capacidade e preço do evento EliteTickets.
- **FR-006**: Informações operacionais do catálogo externo MUST NOT preencher de forma definitiva nem substituir data, horário, local, capacidade ou preço definidos pelo ORGANIZER.
- **FR-007**: Antes de confirmar a criação, o sistema MUST distinguir visualmente os dados de origem dos dados comerciais e operacionais do EliteTickets.
- **FR-008**: Ao criar o evento, o sistema MUST preservar localmente a identificação da origem e os dados de conteúdo necessários para apresentar e reconhecer o evento sem nova consulta ao provedor.
- **FR-009**: Mudanças ou remoção posterior do item externo MUST NOT alterar automaticamente o evento EliteTickets já criado.
- **FR-010**: Indisponibilidade, lentidão ou resposta inválida do catálogo MUST NOT impedir autenticação, navegação, descoberta interna, compra, gerenciamento ou validação de eventos EliteTickets já armazenados.
- **FR-011**: A pesquisa MUST apresentar estados mutuamente distinguíveis para carregamento, nenhum resultado, falha geral do provedor, falha de autenticação/configuração e limite temporário de requisições.
- **FR-012**: Cada estado de falha MUST orientar uma próxima ação aplicável, sem apresentar sucesso vazio nem atribuir a falha a eventos internos já armazenados.
- **FR-013**: Credenciais e outros segredos do provedor MUST NOT ser enviados, exibidos ou tornados recuperáveis pelo navegador ou por mensagens de erro ao usuário.
- **FR-014**: As ações de pesquisa, seleção e criação MUST ser autorizadas no limite confiável do sistema e MUST negar acesso a CUSTOMER, GATE e usuários não autenticados.
- **FR-015**: O sistema MUST registrar erros da integração com contexto suficiente para diagnóstico, sem registrar credenciais ou segredos.
- **FR-016**: Antes de qualquer modificação visual, a equipe MUST ler DESIGN.md, docs/design/stitch-prompts.md e todos os arquivos HTML existentes em docs/design/.
- **FR-017**: DESIGN.md MUST permanecer a fonte principal para linguagem visual; as referências HTML MUST orientar estrutura, hierarquia, composição, espaçamento, interação e responsividade sem serem reproduzidas literalmente.
- **FR-018**: A experiência reconstruída MUST usar elementos reutilizáveis e coerentes entre telas, preservando a identidade editorial relacionada a ingressos, eventos, cartazes e cinema/show.
- **FR-019**: A experiência reconstruída MUST evitar uma linguagem visual nova ou genérica de painel administrativo que conflite com os artefatos aprovados.
- **FR-020**: Todas as principais telas e estados MUST ser responsivos, com CUSTOMER mobile-first, GATE priorizando velocidade e legibilidade e ORGANIZER priorizando desktop sem perder usabilidade em telas menores.
- **FR-021**: O fluxo CUSTOMER MUST preservar autenticação, listagem de eventos, detalhes, escolha de quantidade, reserva, checkout, pagamento aprovado, pagamento recusado, Meus Ingressos, QR Code e compartilhamento.
- **FR-022**: O fluxo ORGANIZER MUST preservar autenticação, pesquisa no catálogo, seleção da origem externa, criação, gerenciamento e visualização de estoque vendido e disponível.
- **FR-023**: O fluxo GATE MUST preservar autenticação, seleção de evento, leitura de QR, entrada manual e os resultados VALID, INVALID, ALREADY_USED e WRONG_EVENT.
- **FR-024**: A evolução MUST NOT alterar as regras existentes de autorização, reserva, controle atômico de estoque, pagamento, geração e compartilhamento de ingressos, proteção do QR e validação única na portaria.
- **FR-025**: Nenhuma operação de inventário decorrente dos fluxos preservados MUST resultar em estoque negativo ou venda acima da capacidade.
- **FR-026**: Nenhum ingresso MUST ser consumido duas vezes, inclusive diante de tentativas simultâneas ou repetidas.
- **FR-027**: Os comportamentos novos de pesquisa, seleção, persistência da origem, estados de falha e autorização MUST possuir verificações automatizadas de sucesso e falha.
- **FR-028**: Os testes existentes aplicáveis aos fluxos preservados MUST continuar aprovados após a evolução.

### Key Entities *(include if feature involves data)*

- **Item do Catálogo Externo**: Resultado transitório de pesquisa usado para identificar um show ou evento; inclui identificador do provedor, título, imagem opcional, categoria opcional e demais dados básicos disponíveis para diferenciação.
- **Origem Externa Preservada**: Cópia estável dos dados relevantes do item selecionado no momento da criação; mantém sua proveniência e permite apresentar o evento sem depender de nova pesquisa.
- **Evento EliteTickets**: Evento pertencente ao ORGANIZER, relacionado a uma origem externa preservada e contendo seus próprios data, horário, local, capacidade, preço, estoque vendido e estoque disponível.
- **Estado da Pesquisa**: Condição observável da tentativa mais recente: inicial, carregando, resultados, nenhum resultado, falha geral, falha de autenticação/configuração ou limite temporário.
- **Artefato de Design Aprovado**: Referência de direção visual, estrutura, hierarquia, composição, espaçamento, interação ou responsividade que orienta a reconstrução sem definir a arquitetura da aplicação.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes de aceitação, pelo menos 95% dos ORGANIZERs conseguem pesquisar, selecionar uma origem, configurar os cinco dados operacionais obrigatórios e criar um evento em até 3 minutos, sem assistência.
- **SC-002**: Em 100% dos eventos criados a partir do catálogo, data, horário, local, capacidade e preço exibidos correspondem aos valores confirmados pelo ORGANIZER, não aos valores da origem externa.
- **SC-003**: Em 100% dos cenários de indisponibilidade externa testados, eventos previamente criados continuam acessíveis aos fluxos autorizados de CUSTOMER, ORGANIZER e GATE.
- **SC-004**: Em 100% dos testes dos cinco estados excepcionais de pesquisa, o ORGANIZER distingue corretamente carregamento, nenhum resultado, falha geral, falha de autenticação/configuração e limite temporário e encontra uma próxima ação apropriada.
- **SC-005**: Nenhuma credencial ou segredo do catálogo externo aparece em recursos entregues ao navegador, conteúdo visível, mensagens de erro ou registros acessíveis ao usuário nos testes de segurança.
- **SC-006**: Todos os cenários automatizados existentes aplicáveis aos fluxos CUSTOMER, ORGANIZER e GATE permanecem aprovados, sem regressões nas regras críticas.
- **SC-007**: Uma revisão visual de todas as principais telas, em pelo menos uma largura móvel e uma desktop, confirma 100% de conformidade com os critérios documentados de linguagem, hierarquia, identidade e responsividade dos artefatos aprovados.
- **SC-008**: Em testes de tarefa, pelo menos 90% dos usuários de cada papel concluem sua jornada principal na primeira tentativa; para GATE, a identificação do resultado da validação ocorre em até 2 segundos após sua exibição.
- **SC-009**: Em todos os testes de concorrência e repetição aplicáveis, o estoque nunca fica negativo, não há venda acima da capacidade e nenhum ingresso registra mais de uma entrada.

## Assumptions

- A pesquisa por palavra-chave é o único modo de descoberta externa incluído nesta evolução; filtros avançados e sincronização contínua ficam fora do escopo.
- O item externo fornece conteúdo e proveniência, mas não concede ao provedor autoridade sobre os dados comerciais ou operacionais do evento EliteTickets.
- Título e identificador de origem são preservados; imagem, categoria e demais informações básicas são preservadas quando estiverem disponíveis e forem adequadas para apresentação.
- O evento criado mantém uma cópia estável da origem; atualizações automáticas posteriores a partir do catálogo não fazem parte desta evolução.
- A autenticação e os três papéis existentes serão reutilizados sem mudança de modelo de acesso.
- A reconstrução visual cobre as telas necessárias aos fluxos explicitamente listados, incluindo seus estados de sucesso, vazio, carregamento e erro relevantes.
- Os artefatos de design existentes estão aprovados e não serão alterados por esta feature; divergências entre referências serão resolvidas dando precedência a DESIGN.md.
- Regras, dados e automações de demonstração existentes serão adaptados apenas quando necessário para representar a nova origem sem depender de credenciais reais.
- A disponibilidade e os limites de uso do catálogo Ticketmaster são dependências externas; a continuidade funcional exigida aplica-se aos eventos já armazenados, não à execução de novas pesquisas durante uma indisponibilidade.

## Scope Boundaries

### Included

- Pesquisa e seleção de itens Ticketmaster por ORGANIZER.
- Criação de evento EliteTickets com origem externa preservada e configuração operacional própria.
- Estados explícitos de pesquisa e isolamento de falhas externas.
- Reconstrução responsiva das telas dos fluxos CUSTOMER, ORGANIZER e GATE listados nesta especificação.
- Preservação e verificação automatizada das regras críticas existentes.

### Excluded

- Venda de inventário pertencente à Ticketmaster dentro do EliteTickets.
- Importação automática de preço, capacidade, data, horário ou local como configuração definitiva.
- Sincronização automática de alterações feitas posteriormente no item externo.
- Dependência do catálogo externo para exibir, comprar, gerenciar ou validar eventos já criados.
- Novos papéis, novos meios de pagamento ou mudanças nas regras de reserva, ingresso, QR e portaria.
- Uma nova identidade visual ou alterações nos artefatos de design aprovados.

## Dependencies

- Acesso autorizado e configurado ao catálogo Ticketmaster para novas pesquisas.
- Disponibilidade dos artefatos DESIGN.md, docs/design/stitch-prompts.md e dos arquivos HTML em docs/design/ para orientar a revisão visual.
- Fluxos, regras críticas e verificações automatizadas existentes como linha de base para regressão.
