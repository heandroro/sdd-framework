# APM Standards — Padrões Application Performance Monitor

> **Instrução para IA**: Este documento define os padrões conceituais de
> Application Performance Monitor para este projeto, alinhados ao modelo
> de observabilidade da Microsoft (Azure Monitor / Application Insights).
> Todo `design.md` de spec deve seguir estes padrões na seção de Application Performance Monitor.

---

## Modelo de Observabilidade Adotado

Este projeto adota os **três pilares de observabilidade** conforme o modelo
Microsoft:

```
┌──────────────────────────────────────────────────────────────┐
│     MICROSOFT APPLICATION PERFORMANCE MONITOR — TRÊS PILARES         │
├──────────────┬──────────────────┬────────────────────────────┤
│   LOGS       │   MÉTRICAS       │   TRACES                   │
│ (Traces      │ (Metrics)        │ (Distributed Tracing)      │
│  textuais)   │                  │                            │
│              │ Valores          │ Fluxo de uma requisição    │
│ Eventos      │ numéricos        │ através de múltiplos       │
│ estruturados │ ao longo do      │ componentes/serviços       │
│ e exceções   │ tempo            │                            │
└──────────────┴──────────────────┴────────────────────────────┘
```

---

## Categorias de Telemetria

### 1. Traces / Logs Estruturados

Logs devem ser **estruturados** (JSON ou pares chave-valor), nunca strings
livres sem contexto.

**Campos obrigatórios em todo log**:

| Campo            | Descrição                                        |
|------------------|--------------------------------------------------|
| `timestamp`      | ISO 8601 UTC                                     |
| `level`          | INFO / WARN / ERROR / DEBUG                      |
| `correlationId`  | ID de correlação da requisição (trace ID)        |
| `component`      | Nome do componente/serviço que gerou o log       |
| `operation`      | Nome da operação em andamento                    |
| `userId`         | ID do usuário (quando aplicável, sem PII direta) |

**Quando logar**:
- Início e fim de operações de negócio relevantes
- Todas as exceções capturadas (com stack trace)
- Transições de estado importantes

---

### 2. Métricas Customizadas

Métricas são séries temporais numéricas que permitem alertas e dashboards.

**Convenção de nomenclatura**:
```
<domínio>.<componente>.<operação>.<unidade>

Exemplos:
  orders.processor.checkout.duration_ms
  payments.gateway.transactions.count
  inventory.cache.hit_rate.percent
```

**Tipos de métrica por caso de uso**:

| Tipo       | Quando usar                              | Exemplo                          |
|------------|------------------------------------------|----------------------------------|
| Counter    | Contar ocorrências de eventos            | `pedidos_criados_total`          |
| Gauge      | Valor instantâneo (snapshot)             | `fila_tamanho_atual`             |
| Histogram  | Distribuição de valores (ex: latência)   | `checkout_duracao_ms`            |
| Rate       | Taxa ao longo do tempo                   | `erros_por_minuto`               |

---

### 3. Traces Distribuídos

Toda operação que atravessa limites de serviço deve propagar um **Trace Context**
(padrão W3C TraceContext / OpenTelemetry).

**Spans obrigatórios**:
- Entrada de requisição HTTP (inbound)
- Chamadas a serviços externos (outbound HTTP, mensageria)
- Operações de banco de dados
- Chamadas a filas/tópicos (Service Bus, Event Hub)

---

### 4. Custom Events (Eventos de Negócio)

Eventos de negócio relevantes devem ser capturados como **custom events** no Application Performance Monitor.
Estes diferem de logs operacionais — capturam fatos de domínio para análise
de comportamento e uso.

**Convenção de nomenclatura**:
```
<Entidade><Verbo>  (PascalCase)

Exemplos:
  OrderPlaced
  PaymentApproved
  UserOnboarded
  CartAbandoned
```

**Campos recomendados em custom events**:
```json
{
  "name": "OrderPlaced",
  "properties": {
    "orderId": "...",
    "channel": "web|mobile|api",
    "itemCount": 3
  },
  "measurements": {
    "orderValue": 149.90
  }
}
```

---

## SLOs Padrão (Service Level Objectives)

Valores de referência a serem especializados por feature em cada `design.md`.
Todo spec deve definir seus SLOs explicitamente.

| Indicador              | Threshold padrão    | Critério de Alerta         |
|------------------------|---------------------|----------------------------|
| Latência P95           | < 500ms             | > 1000ms por 5 min         |
| Latência P99           | < 2000ms            | > 5000ms por 2 min         |
| Taxa de Erro HTTP      | < 1%                | > 5% por 3 min             |
| Taxa de Exceções       | < 0.1%              | > 1% por 5 min             |
| Disponibilidade        | > 99.9%             | < 99% em janela de 1h      |

---

## Padrões de Alerta

### Severidades

| Severidade | Impacto                                | Resposta esperada         |
|------------|----------------------------------------|---------------------------|
| Critical   | Serviço indisponível / perda de dados  | Resposta imediata (PD)    |
| High       | Degradação significativa para usuários | Resposta em < 30 min      |
| Medium     | Degradação parcial / comportamento     | Resposta em < 4 horas     |
| Low        | Anomalia sem impacto imediato          | Análise no próximo ciclo  |

### Template de Definição de Alerta

Cada alerta definido em um spec deve seguir este template:

```yaml
alert:
  id: ALT-<número>
  name: "<nome descritivo>"
  condition: "<métrica> <operador> <threshold> por <janela de tempo>"
  severity: Critical | High | Medium | Low
  impact: "<o que é afetado para o usuário>"
  action: "<o que deve ser feito ao disparar>"
  runbook: "<link para runbook ou descrição de procedimento>"
```

---

## Dashboard Padrão por Feature

Toda feature monitorável deve ter um conceito de dashboard com, no mínimo:

```
┌─────────────────────────────────────────────────────┐
│  SEÇÃO 1 — Saúde Geral                              │
│  [ Disponibilidade ]  [ Taxa de Erro ]  [ P95 ]     │
├─────────────────────────────────────────────────────┤
│  SEÇÃO 2 — Volume                                   │
│  [ Requisições/min ]  [ Custom Events/min ]         │
├─────────────────────────────────────────────────────┤
│  SEÇÃO 3 — Negócio (KPIs)                           │
│  [ Métricas de negócio específicas da feature ]     │
├─────────────────────────────────────────────────────┤
│  SEÇÃO 4 — Alertas Ativos                           │
│  [ Lista de alertas disparados nas últimas 24h ]    │
└─────────────────────────────────────────────────────┘
```

---

## Dados Sensíveis (Compliance)

**NUNCA inclua nos dados de telemetria**:
- Senhas, tokens, chaves de API
- Números de cartão de crédito / dados financeiros completos
- Dados de saúde (LGPD / HIPAA)
- CPF, RG, dados pessoais identificáveis diretamente (PII)

Use sempre **IDs internos** de entidades de negócio, nunca os dados brutos.

---

---

# Parte 2 — Agent Package Manager (APM CLI)

> **Nota de nomenclatura**: Esta seção usa "APM" no sentido de *Agent Package Manager*
> (microsoft/apm), gerenciador de dependências de contexto para agentes de IA.
> A Parte 1 deste documento cobre Application Performance Monitoring (observabilidade).
> Prefixo de IDs desta seção: `PKG-`.

---

## O que é o Agent Package Manager

O APM CLI é um gerenciador de dependências para contexto de agentes de IA — análogo
ao npm para JavaScript. Ele empacota *primitivos* de contexto (instructions, prompts,
agents, skills, hooks, MCP servers) em pacotes versionados instaláveis em múltiplos
harnesses (Copilot, Claude, Cursor, Codex, Gemini, OpenCode, Windsurf).

---

## Primitivos e Cobertura por Target

| Primitivo | Arquivo fonte | Copilot | Claude | Cursor | Codex | Gemini | OpenCode | Windsurf |
|-----------|--------------|---------|--------|--------|-------|--------|----------|----------|
| **Instruction** | `.apm/instructions/*.instructions.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Prompt** | `.apm/prompts/*.prompt.md` | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Agent** | `.apm/agents/*.agent.md` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Skill** | `.apm/skills/<nome>/SKILL.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Hook** | `.apm/hooks/*.json` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **MCP Server** | `apm.yml → dependencies.mcp:` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> Commands não têm arquivo próprio — emergem dos `.prompt.md` em Claude, Cursor,
> OpenCode, Gemini e Windsurf. Copilot e Codex recebem o mesmo arquivo como prompt.

---

## Estrutura de Diretórios Esperada

```
.apm/
  instructions/
    <feature>.instructions.md
  prompts/
    <feature>.prompt.md
  agents/
    <feature>.agent.md
  skills/
    <feature>/
      SKILL.md
      references/       # overflow de body (>500 linhas / >5000 tokens)
  hooks/
    <nome>.json
apm.yml                 # manifest do pacote
```

---

## Convenções de Nomenclatura de Arquivos

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Instruction | `<feature>.instructions.md` | `payments.instructions.md` |
| Prompt | `<feature>.prompt.md` | `review-pr.prompt.md` |
| Agent | `<feature>.agent.md` | `security-review.agent.md` |
| Skill | `<feature>/SKILL.md` | `run-tests/SKILL.md` |
| Hook | `<nome>.json` | `pre-commit.json` |

---

## Regras por Primitivo

### Instructions

- `applyTo` é obrigatório quando o escopo for de arquivos — sem ele a instruction
  vira regra global no `AGENTS.md` de todos os consumidores
- Um arquivo = uma regra = um escopo (não misturar python-style e python-testing)
- Corpo: bullets, não prosa; começa pela regra

### Prompts

- Um arquivo = um comando = um intent focado; se o corpo ramifica em múltiplos
  workflows, dividir em dois prompts
- Frontmatter: apenas `description`, `input`, `allowed-tools`, `model`,
  `argument-hint` — outras chaves são descartadas com warning no integrate
- Nomes de input: padrão `[A-Za-z][\w-]{0,63}`, referenciados no corpo como `${input:nome}`
- Codex não recebe prompts — para cobertura total, complementar com skill

### Agents

- Corpo ≤ 300 linhas; não replicar instructions globais (agent herda contexto compilado)
- `model` e `tools` chegam ao Copilot, Claude, Cursor, OpenCode e Codex; Windsurf descarta
- Gemini não recebe agents
- Nomes proibidos: `default`, `start` (colidem com `apm run`)

### Skills

- Nome do diretório = identidade da skill; `name:` no frontmatter deve bater exatamente
- `description` ≤ 1024 chars, imperativo (`"Use when…"`, `"Apply when…"`)
- Corpo < 500 linhas / 5000 tokens — overflow vai em `references/<topic>.md`
  com `LOAD references/<file>` no body
- Uma description ruim torna a skill invocada — escrever com precisão

### Hooks

- Apenas eventos `PreToolUse` / `PostToolUse`
- Scripts sempre via `${PLUGIN_ROOT}/...` — caminhos absolutos quebram no consumidor
- OpenCode não recebe hooks

### MCP Servers

- Três formas: `registry` (id npm-style), `self-defined stdio` (command+args),
  `self-defined remote` (url+headers)
- `command` nunca contém espaços — argumentos em `args`
- `url` apenas `http://` ou `https://` — WebSocket e `file://` rejeitados
- **NUNCA** tokens/secrets literais — usar `${NOME_DA_VAR}`
- Self-defined servers só instalados automaticamente se dependência direta;
  transitivos requerem `--trust-transitive-mcp` do consumidor
- Servidores de dev/mock em `devDependencies.mcp:`, não em `dependencies.mcp:`

---

## Prefixos de ID para Specs

| Domínio | Prefixo | Uso |
|---------|---------|-----|
| Instructions | `PKG-I` | `PKG-I1`, `PKG-I2` |
| Prompts | `PKG-P` | `PKG-P1`, `PKG-P2` |
| Agents | `PKG-A` | `PKG-A1`, `PKG-A2` |
| Skills | `PKG-S` | `PKG-S1`, `PKG-S2` |
| Hooks | `PKG-H` | `PKG-H1`, `PKG-H2` |
| MCP Servers | `PKG-M` | `PKG-M1`, `PKG-M2` |

---

## Template de apm.yml

```yaml
name: "<nome-do-pacote>"
version: "0.1.0"
description: "<descrição do que este pacote fornece>"

dependencies:
  apm:
    - "<org>/<pacote>@<versão>"  # pacotes APM de que este depende

  mcp:
    # Forma 1 — registry (flui transitivamente)
    - id: "io.github.org/server-name"

    # Forma 2 — self-defined stdio
    - id: "local-server"
      registry: false
      command: "npx"
      args: ["-y", "@org/mcp-server"]

    # Forma 3 — self-defined remote (HTTP/SSE)
    - id: "remote-server"
      registry: false
      url: "https://api.example.com/mcp"
      headers:
        Authorization: "Bearer ${API_TOKEN}"

devDependencies:
  mcp:
    - id: "mock-server"
      registry: false
      command: "node"
      args: ["scripts/mock-server.js"]
```
