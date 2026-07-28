# SDD Session — Guia de Uso

Como usar o ciclo SDD no seu editor, com exemplos de sessão para cada fase.

> Para os diagramas de referência do ciclo completo, veja [SDD-FLOW.md](SDD-FLOW.md).

---

## Como usar este framework

Após instalar o pacote (`apm install sdd-framework`), os primitivos são ativados
automaticamente no seu editor. Basta conversar com o agente normalmente.

### Exemplo de sessão — projeto novo

> **Usuário:** quero começar a usar o SDD neste projeto. é uma API de gestão de frotas para logística B2B.
>
> **Agente:** Vou inicializar o memory bank. Antes de criar os arquivos, preciso de algumas informações:
> - Qual o estilo arquitetural? (ex: microsserviços, monolito modular)
> - Quais linguagens/plataformas principais?
> - Já tem dependências externas conhecidas? (banco, broker, gateway)
>
> **Usuário:** microsserviços em Node.js, PostgreSQL e Kafka. gateway de pagamento externo.
>
> **Agente:** *(cria `.sdd/memory-bank/` com os 4 arquivos)* Memory bank inicializado.
> Use `/criar-spec` para começar o primeiro spec.

### Exemplo de sessão — feature nova

> **Usuário:** `/criar-spec rastreamento-de-entrega`
>
> **Agente:** *(tenta ler o memory bank — arquivos ausentes)* O memory bank ainda não foi
> inicializado. Antes de criar um spec, preciso das informações do projeto. Execute
> `/init-memory-bank` ou me diga:
> - Qual o estilo arquitetural?
> - Linguagens/plataformas principais?
> - Dependências externas conhecidas?
>
> **Usuário:** pode inicializar. microsserviços em Node.js, PostgreSQL e Kafka.
>
> **Agente:** *(cria `.sdd/memory-bank/` com os 4 arquivos)* Memory bank inicializado.
> Continuando com `/criar-spec rastreamento-de-entrega`...
>
> *(lê o memory bank)* Vou criar o `requirements.md` para rastreamento-de-entrega.
> Antes, a pasta `.sdd/specs/rastreamento-de-entrega/` não existe ainda — execute:
> ```
> cp -r .sdd/specs/_template .sdd/specs/rastreamento-de-entrega
> ```
> *(após execução)* Criando `requirements.md`...
>
> **Usuário:** *(revisa o arquivo gerado)* aprovado.
>
> **Agente:** Perfeito. Próximo passo: posso criar o `design.md` quando quiser.
> Use `/revisar-spec requirements` a qualquer momento para uma revisão formal.

### Exemplo de sessão — mudança pequena (JIT Spec)

> **Usuário:** o retry de pagamento está dando falso negativo quando o gateway demora mais de 2s. aumenta o timeout pra 5s?
>
> **Agente:** *(lê o memory bank e faz a triagem)* Mudança pequena: 1 componente
> (`payment/client.ts`), 1 arquivo, sem decisão arquitetural nova, telemetria
> existente cobre o cenário. Elegível para **JIT Spec**:
>
> ```markdown
> ## JIT Spec — corrigir timeout no retry de pagamento
>
> **Intenção**: aumentar o timeout do client de pagamento de 2s para 5s,
> que está causando falsos negativos no retry.
>
> **Aceite**: pedidos com resposta entre 2–5s completam sem acionar retry;
> testes de integração do módulo payment continuam verdes.
>
> **Toca**: `payment/client.ts` (1 componente, 1 arquivo).
>
> **Telemetria**: coberto pelo trace existente `payment.charge` e pela
> métrica `payment.retry.count` — nada novo necessário.
>
> Elegível: ✅ 1 componente · ≤2 arquivos · sem decisão arquitetural · sem telemetria nova
> ```
>
> Aprova o contrato?
>
> **Usuário:** aprovado
>
> **Agente:** *(implementa e roda os testes)* Concluído — diff pronto para revisão.
> Adicionei a entrada `Fixed` no CHANGELOG. O artefato JIT será descartado após o merge.

> **ℹ️** Se durante a execução surgir decisão arquitetural ou necessidade de
> telemetria nova, o agente **para** e propõe promoção para spec completa
> (regra de escalada). Mudanças triviais (typo, cosmético) ficam abaixo do
> JIT Spec — direto ao código, sem contrato.

### Exemplo de sessão — execução de task

> **Usuário:** pode começar a T-03 do rastreamento-de-entrega?
>
> **Agente:** Confirmando: T-03 — Implementar endpoint `GET /entregas/{id}/posicao` `[REQ-2.1]`.
> Posso iniciar?
>
> **Usuário:** sim
>
> **Agente:** *(implementa)* Concluído. Marquei `[x]` em `tasks.md`. Aguardo sua aprovação
> para avançar para a T-04.

> **ℹ️** Quando a última task de implementação for concluída, o agente verifica se as tasks
> T-APM-xx e T-DOC-xx ainda estão pendentes antes de declarar o spec completo.

### Exemplo de sessão — fechamento de spec

> **Usuário:** concluí a T-APM-05. pode marcar?
>
> **Agente:** Marcado. Tasks de Documentação / Memory Bank ainda pendentes:
> - T-DOC-01: Promover decisões arquiteturais → `architecture.md`
> - T-DOC-02: Atualizar `KNOWLEDGE.md`
> - T-DOC-03: Verificar `product.md`
>
> Posso iniciar T-DOC-01?
>
> **Usuário:** sim
>
> **Agente:** *(lê `design.md` e `architecture.md`)* Identifiquei 2 decisões com impacto
> transversal: adoção do padrão Circuit Breaker para chamadas ao gateway externo e uso de
> eventos Kafka para desacoplar o serviço de rastreamento. Adicionando em `architecture.md`.
> Concluído — aguardo aprovação.
>
> **Usuário:** aprovado.
>
> **Agente:** *(executa T-DOC-02 e T-DOC-03)* Checklist Final 100% marcado.
>
> Gostaria de conduzir uma retrospectiva do ciclo? é opcional — percorremos 9 perguntas
> em 3 blocos e registro o resultado em `KNOWLEDGE.md`.
>
> **Usuário:** sim
>
> **Agente:** Bloco 1 — Qualidade do Spec. O `requirements.md` estava completo,
> ou surgiram lacunas funcionais durante o design ou a implementação?

---

## Primitivos disponíveis

| Como invocar | O que faz |
|---|---|
| `/init-memory-bank` | Inicializa o memory bank em projetos novos |
| `/criar-spec <feature>` | Cria `requirements.md` para uma nova feature |
| `/revisar-spec <etapa>` | Revisa requirements, design ou tasks — retorna ✅/⚠️/❌ |
| `/gerar-tasks <feature>` | Gera `tasks.md` a partir de um `design.md` aprovado |
| `/promover-adr <decisão>` | Registra decisão arquitetural como ADR |
| `/atualizar-produto <mudança>` | Atualiza `product.md` com nova visão ou segmento |
| `/atualizar-apm-standards <padrão>` | Atualiza `apm-standards.md` com novo padrão de observabilidade |
| `/referenciar-doc <url> <tech>` | Busca e registra documentação de tecnologia em `.sdd/references/` |
| `/referenciar-repo <owner/repo> <nome>` | Analisa estrutura de repositório GitHub de referência via MCP e registra em `.sdd/references/` |
| `@sdd` | Agente completo que conduz o ciclo SDD com aprovações humanas |
