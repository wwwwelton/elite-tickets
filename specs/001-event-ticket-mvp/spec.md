# Feature Specification: MVP de Eventos e Ingressos

**Feature Branch**: `não criada (nenhum hook de branch configurado)`

**Created**: 2026-08-10

**Status**: Draft

**Input**: User description: "Criar o MVP de uma plataforma de eventos e ingressos para ORGANIZER, CUSTOMER e GATE, cobrindo publicação, venda por quantidade, pagamento simulado, emissão, compartilhamento e validação segura de ingressos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprar e receber ingressos (Priority: P1)

Como CUSTOMER autenticado, quero descobrir um evento publicado, reservar uma quantidade disponível e concluir um pagamento simulado para receber meus ingressos e poder apresentá-los na entrada.

**Why this priority**: Este é o principal fluxo de geração de valor do produto e conecta descoberta, inventário, pagamento e emissão.

**Independent Test**: Pode ser testado com um evento previamente publicado: o cliente pesquisa o evento, reserva duas unidades, recebe aprovação no pagamento e encontra dois ingressos válidos em Meus Ingressos.

**Acceptance Scenarios**:

1. **Given** existem eventos publicados, **When** o CUSTOMER navega ou pesquisa, **Then** visualiza somente eventos publicados com poster, título, data, horário, local e preço.
2. **Given** um evento publicado possui capacidade disponível, **When** o CUSTOMER abre os detalhes, escolhe uma quantidade válida e cria a reserva, **Then** a quantidade fica vinculada à reserva sem ultrapassar a disponibilidade.
3. **Given** uma reserva pendente válida, **When** o pagamento simulado é aprovado, **Then** a reserva é confirmada, um ingresso por unidade é emitido e o CUSTOMER recebe confirmação de aprovação.
4. **Given** uma reserva pendente válida, **When** o pagamento simulado é recusado, **Then** o CUSTOMER recebe confirmação de recusa, nenhum ingresso válido é emitido e a quantidade reservada volta a ficar disponível.
5. **Given** ingressos foram emitidos, **When** o proprietário acessa Meus Ingressos, **Then** consegue visualizar cada ingresso e seu QR Code.

---

### User Story 2 - Criar e publicar evento de filme (Priority: P2)

Como ORGANIZER autenticado, quero selecionar um filme de um catálogo externo e configurar um evento para disponibilizá-lo aos clientes e acompanhar suas vendas.

**Why this priority**: Sem a oferta criada e publicada não há inventário para o fluxo comercial, mas o fluxo pode ser demonstrado isoladamente com clientes e eventos semeados.

**Independent Test**: Pode ser testado pesquisando um filme, selecionando-o, preenchendo local, data, horário, capacidade e preço, publicando o evento e conferindo-o na listagem do organizador.

**Acceptance Scenarios**:

1. **Given** o ORGANIZER está autenticado e o catálogo está disponível, **When** pesquisa filmes, **Then** recebe resultados suficientes para identificar e selecionar um filme.
2. **Given** um filme foi selecionado, **When** o ORGANIZER informa local, data, horário, capacidade inteira positiva e preço não negativo, **Then** consegue criar um evento ainda não publicado.
3. **Given** um evento possui todos os dados obrigatórios válidos, **When** seu ORGANIZER o publica, **Then** ele se torna visível para CUSTOMER.
4. **Given** o ORGANIZER possui eventos, **When** abre sua listagem, **Then** vê apenas seus eventos e, para cada um, capacidade, quantidade vendida e quantidade disponível consistentes.
5. **Given** o catálogo externo está indisponível, **When** o ORGANIZER pesquisa, **Then** recebe uma mensagem de falha e nenhum evento incompleto é criado involuntariamente.

---

### User Story 3 - Validar entrada com segurança (Priority: P3)

Como GATE autenticado, quero selecionar um evento e validar um ingresso por câmera ou código manual para admitir somente a pessoa portadora de um ingresso elegível e ainda não utilizado.

**Why this priority**: Completa o ciclo do ingresso e protege o acesso, embora compra e emissão ainda possam ser demonstradas antes deste fluxo.

**Independent Test**: Pode ser testado selecionando um evento e submetendo códigos representativos de ingresso válido, inexistente ou adulterado, já utilizado e pertencente a outro evento, conferindo os quatro resultados explícitos.

**Acceptance Scenarios**:

1. **Given** o GATE selecionou o evento correto e lê um ingresso pago, válido e não utilizado, **When** confirma a validação, **Then** recebe `VALID` e o ingresso é marcado como utilizado exatamente uma vez.
2. **Given** um código é inexistente, adulterado ou não corresponde a ingresso válido, **When** o GATE o submete, **Then** recebe `INVALID` e nenhum ingresso é consumido.
3. **Given** um ingresso já foi utilizado, **When** seu código é submetido novamente, **Then** o GATE recebe `ALREADY_USED` e nenhuma segunda entrada é registrada.
4. **Given** um ingresso válido pertence a evento diferente do selecionado, **When** o GATE o submete, **Then** recebe `WRONG_EVENT` e o ingresso permanece não utilizado.
5. **Given** a leitura por câmera não é possível, **When** o GATE digita o código exibido no ingresso, **Then** obtém o mesmo processo e os mesmos resultados de validação.

---

### User Story 4 - Compartilhar ingresso sem transferi-lo (Priority: P4)

Como CUSTOMER proprietário, quero gerar e compartilhar um link de acesso ao ingresso para que outra pessoa possa apresentá-lo, sem alterar sua propriedade.

**Why this priority**: Facilita o uso real do ingresso, mas não é necessário para provar o fluxo principal de emissão e validação.

**Independent Test**: Pode ser testado abrindo um link compartilhado em sessão separada, exibindo os dados necessários do ingresso e confirmando que o proprietário registrado não mudou.

**Acceptance Scenarios**:

1. **Given** o CUSTOMER possui um ingresso, **When** solicita seu link de compartilhamento, **Then** recebe um link não previsível que permite apresentar o ingresso.
2. **Given** uma pessoa abre um link compartilhado válido, **When** visualiza o ingresso, **Then** consegue acessar os dados necessários e o QR Code sem receber direitos de propriedade ou gestão sobre ele.
3. **Given** um ingresso foi compartilhado, **When** seu proprietário consulta Meus Ingressos, **Then** o ingresso continua associado ao mesmo CUSTOMER.

### Edge Cases

- Duas ou mais reservas concorrentes disputam as últimas unidades: apenas quantidades dentro da capacidade podem ser reservadas e a disponibilidade nunca fica negativa.
- A quantidade solicitada é zero, negativa, fracionária ou superior à disponibilidade: a reserva é recusada com mensagem clara e sem alterar o inventário.
- O pagamento é repetido para a mesma reserva: não pode duplicar cobrança simulada, confirmação nem ingressos.
- O pagamento chega após a reserva deixar de estar pendente: não pode emitir ingressos nem alterar um resultado final já registrado.
- O mesmo ingresso é validado simultaneamente em dois dispositivos: no máximo uma tentativa retorna `VALID`; as demais retornam `ALREADY_USED`.
- O código é bem formado, mas adulterado ou impossível de verificar: o resultado é `INVALID` sem revelar detalhes que facilitem falsificação.
- Um evento não publicado é acessado por busca ou link direto de CUSTOMER: seus detalhes e compra não são disponibilizados.
- O organizador tenta consultar ou alterar evento de outro organizador: a operação é negada.
- Usuário autenticado tenta executar ação exclusiva de outro papel: a operação é negada, mesmo que a interface seja contornada.
- Poster ou dado opcional do catálogo não está disponível: o evento continua identificável e a interface usa uma apresentação substituta.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE autenticar usuários e associar exatamente um papel `ORGANIZER`, `CUSTOMER` ou `GATE` à sessão autenticada.
- **FR-002**: O sistema DEVE autorizar no backend cada operação protegida conforme o papel e a propriedade do recurso, negando ações não explicitamente permitidas.
- **FR-003**: O ORGANIZER DEVE poder pesquisar filmes no catálogo externo e selecionar um resultado com, no mínimo, identificador do catálogo, título e poster quando disponível.
- **FR-004**: O ORGANIZER DEVE poder criar um evento associado ao filme selecionado, informando local, data, horário, capacidade inteira positiva e preço não negativo.
- **FR-005**: Um evento recém-criado DEVE permanecer não publicado até ação explícita de seu ORGANIZER.
- **FR-006**: O sistema DEVE permitir a publicação somente de evento com todos os campos obrigatórios válidos.
- **FR-007**: O ORGANIZER DEVE visualizar somente os eventos que criou, com estado de publicação, capacidade total, quantidade vendida e quantidade disponível.
- **FR-008**: A quantidade disponível DEVE ser calculada de forma consistente com a capacidade e com as unidades comprometidas, e NUNCA DEVE ser negativa.
- **FR-009**: O CUSTOMER DEVE navegar e pesquisar somente eventos publicados por título do filme ou local.
- **FR-010**: Listagens e detalhes de eventos publicados DEVEM apresentar poster, título, data, horário, local, preço e disponibilidade atual.
- **FR-011**: O CUSTOMER autenticado DEVE poder solicitar uma reserva para uma quantidade inteira positiva de ingressos de um único evento publicado.
- **FR-012**: A criação da reserva e o comprometimento de inventário DEVEM ocorrer como uma única operação indivisível, inclusive sob solicitações concorrentes.
- **FR-013**: O sistema DEVE recusar reservas cuja quantidade exceda a disponibilidade, sem comprometer parcialmente a quantidade solicitada.
- **FR-014**: Uma reserva DEVE registrar evento, CUSTOMER, quantidade, valor total, estado e momentos relevantes de criação e conclusão.
- **FR-015**: O CUSTOMER DEVE poder submeter uma reserva pendente a pagamento simulado e receber resultado explícito de aprovado ou recusado.
- **FR-016**: Pagamento aprovado DEVE confirmar a reserva e emitir exatamente um ingresso para cada unidade reservada.
- **FR-017**: Pagamento recusado DEVE finalizar a reserva como recusada, liberar sua quantidade comprometida e NÃO DEVE emitir ingresso válido.
- **FR-018**: Repetições do processamento de uma mesma reserva NÃO DEVEM duplicar ingressos nem mudar um resultado final já estabelecido.
- **FR-019**: O CUSTOMER DEVE acessar Meus Ingressos e visualizar somente os ingressos dos quais é proprietário.
- **FR-020**: Cada ingresso DEVE exibir dados suficientes para identificar evento, proprietário, estado e um QR Code utilizável na entrada.
- **FR-021**: Cada ingresso DEVE possuir código de validação não previsível e verificável; conhecer ou enumerar seu identificador interno não pode ser suficiente para produzir acesso válido.
- **FR-022**: O proprietário DEVE poder gerar um link não previsível para compartilhar a visualização de um ingresso e seu QR Code.
- **FR-023**: Abrir ou utilizar o link compartilhado NÃO DEVE transferir propriedade nem conceder permissão de alteração sobre o ingresso.
- **FR-024**: O GATE DEVE selecionar um evento antes de validar ingressos.
- **FR-025**: O GATE DEVE poder fornecer o código por leitura de QR Code com câmera ou por digitação manual, com comportamento de validação equivalente.
- **FR-026**: Cada tentativa de validação DEVE retornar exatamente um resultado explícito: `VALID`, `INVALID`, `ALREADY_USED` ou `WRONG_EVENT`.
- **FR-027**: O sistema DEVE retornar `VALID` somente para ingresso verificável, originado de pagamento aprovado, pertencente ao evento selecionado e ainda não utilizado, marcando-o como utilizado na mesma operação indivisível.
- **FR-028**: O sistema DEVE retornar `INVALID` para código inexistente, adulterado, inverificável ou que não represente ingresso elegível.
- **FR-029**: O sistema DEVE retornar `ALREADY_USED` para ingresso verificável que já tenha sido utilizado, sem registrar novo uso.
- **FR-030**: O sistema DEVE retornar `WRONG_EVENT` para ingresso verificável de outro evento, sem consumi-lo.
- **FR-031**: Validações simultâneas do mesmo ingresso DEVEM permitir no máximo um resultado `VALID`.
- **FR-032**: Falhas do catálogo externo DEVEM ser comunicadas ao ORGANIZER sem criar eventos involuntários nem comprometer eventos existentes.
- **FR-033**: O produto DEVE fornecer dados de demonstração reproduzíveis que permitam autenticar representantes dos três papéis e percorrer o fluxo principal sem credenciais reais.
- **FR-034**: As regras de autorização, capacidade, concorrência de reservas, emissão condicionada ao pagamento, não previsibilidade do código e consumo único DEVEM possuir verificações automatizadas de sucesso e falha.

### Key Entities

- **Usuário**: Pessoa autenticável, identificada por dados de acesso e exatamente um papel; pode possuir eventos, reservas ou ingressos conforme seu papel.
- **Filme do catálogo**: Referência selecionada no catálogo externo, com identificador externo, título, poster e demais dados descritivos necessários para preservar a apresentação do evento.
- **Evento**: Exibição criada por um ORGANIZER a partir de um filme, com local, data, horário, capacidade, preço, estado de publicação e contadores derivados de inventário.
- **Reserva**: Solicitação de um CUSTOMER para determinada quantidade em um evento, com valor total e estado pendente, aprovado ou recusado; compromete inventário enquanto elegível.
- **Pagamento simulado**: Resultado associado a uma reserva, com decisão aprovada ou recusada e registro do momento de processamento.
- **Ingresso**: Unidade emitida somente após aprovação, pertencente ao CUSTOMER, associada a um evento, com código seguro, estado de uso e eventual momento de validação.
- **Link compartilhado**: Referência não previsível que concede visualização limitada de um ingresso sem alterar sua propriedade.
- **Validação**: Tentativa feita por GATE contra um evento selecionado, registrando ingresso identificável quando aplicável, resultado explícito e momento da tentativa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes de aceitação, pelo menos 90% dos participantes conseguem localizar um evento publicado e concluir uma compra simulada de um ingresso em até 3 minutos, sem assistência.
- **SC-002**: 100% dos pagamentos simulados aprovados em reservas válidas emitem exatamente a quantidade comprada, e 100% dos pagamentos recusados emitem zero ingressos válidos.
- **SC-003**: Em teste concorrente com solicitações que excedem conjuntamente a capacidade, zero eventos apresentam vendas acima da capacidade ou disponibilidade negativa.
- **SC-004**: Em 100 tentativas simultâneas de uso do mesmo ingresso, exatamente uma retorna `VALID` e todas as tentativas posteriores aplicáveis retornam `ALREADY_USED`.
- **SC-005**: 100% dos casos representativos de validação válida, código inválido, ingresso já utilizado e evento incorreto retornam respectivamente `VALID`, `INVALID`, `ALREADY_USED` e `WRONG_EVENT`.
- **SC-006**: Pelo menos 95% das pesquisas e aberturas de eventos apresentam o resultado ao usuário em até 2 segundos em condições normais de demonstração, desconsiderando indisponibilidade declarada do catálogo externo.
- **SC-007**: Um avaliador consegue percorrer, com dados de demonstração, criação e publicação, compra aprovada, consulta do ingresso e validação na entrada em até 10 minutos.
- **SC-008**: Em todos os testes de compartilhamento, o link permite apresentar o ingresso e zero acessos alteram o proprietário ou concedem capacidade de gestão sobre ele.

## Assumptions

- Cada conta possui um único papel no MVP; mudança de papel e múltiplos papéis por conta ficam fora do escopo.
- Contas de demonstração já existem; cadastro público, recuperação de senha e administração de usuários ficam fora do escopo do MVP.
- A pesquisa de eventos cobre título do filme e local, sem filtros avançados.
- Cada reserva contém ingressos de um único evento e de um único CUSTOMER.
- A quantidade fica comprometida durante a reserva pendente; uma recusa libera imediatamente as unidades. Expiração automática de reserva fica fora do escopo inicial.
- O resultado do pagamento simulado é controlável no modo de demonstração para permitir testar aprovação e recusa; não há movimentação financeira real, estorno, reembolso ou cancelamento.
- Cada unidade comprada gera um ingresso individual, mesmo quando a compra possui quantidade maior que um.
- O link compartilhado oferece somente visualização e apresentação; transferência de propriedade, revogação do link e envio por canais externos ficam fora do escopo.
- O GATE pode selecionar qualquer evento publicado para exercer sua função; gestão de equipes de portaria por organizador fica fora do escopo.
- Leitura por câmera depende de dispositivo e permissão compatíveis; a digitação manual é a alternativa obrigatória.
- Datas e horários são apresentados no fuso definido para o evento; recorrência, múltiplas sessões e mapa de assentos ficam fora do escopo.
- O catálogo externo é uma dependência para seleção do filme, mas uma falha temporária não altera eventos já criados.

