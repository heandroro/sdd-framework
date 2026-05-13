# Agent Context — [Nome da Feature]

> **Sobre este documento**: Use-o quando a feature produz primitivos de contexto
> para agentes de IA (Agent Package Manager / APM CLI). Este documento é
> **independente** do ciclo SDD (`requirements.md → design.md → tasks.md`):
> pode ser preenchido antes, depois ou em paralelo ao ciclo de spec da feature.
>
> **Instrução para IA**: Preencha as seções marcadas com `[IA]` com base no
> contexto da feature e nas convenções de `apm-standards.md` (Parte 2).
> **NUNCA** inclua tokens/secrets literais — sempre `${VAR}`.
> Ao finalizar cada etapa, execute o checklist correspondente e reporte itens não atendidos.

---

## Propósito do Pacote

> Descreva em 2-3 frases o que este pacote de contexto entrega ao agente.
> Qual comportamento novo o agente adquire ao instalar este pacote?

**[HUMANO preenche — IA pode sugerir com base no contexto da feature]**

---

## Primitivos `[IA]`

> Para cada tipo de primitivo, liste o que será criado e o que cada um faz.
> O design técnico detalhado (tabelas, apm.yml, targets) fica na seção seguinte.
> Consulte `apm-standards.md` (Parte 2) para regras e restrições por tipo.

### Instructions

> Regras acopladas a globs de arquivos — aplicadas automaticamente pelo agente
> quando toca arquivos que casam com `applyTo`.
> Sem `applyTo`, a instruction vira regra global em todos os consumidores.

- [ ] **[PKG-I1]** `[nome].instructions.md` — [Regra que deve ser aplicada]
  - Escopo (`applyTo`): `[glob — ex: **/*.py, src/payments/**]`
  - _Exemplo: "Toda alteração em src/payments/ deve seguir os padrões de PCI-DSS"_
- [ ] **[PKG-I2]** [...]

### Prompts

> Workflows que o usuário invoca explicitamente (`/comando`).
> **Codex não recebe prompts** — complementar com skill se Codex for target.
> Um prompt = um intent focado; se o fluxo ramifica, dividir em dois.

- [ ] **[PKG-P1]** `[nome].prompt.md` — [O que o comando faz, uma linha]
  - Inputs: `[param1]`, `[param2 (opcional)]`
  - _Exemplo: "Review a pull request against our coding standards" — inputs: pr_url, focus_
- [ ] **[PKG-P2]** [...]

### Agents

> Personas especializadas invocadas via `@nome`.
> **Gemini não recebe agents.** Corpo ≤ 300 linhas. Nomes proibidos: `default`, `start`.

- [ ] **[PKG-A1]** `[nome].agent.md` — [Papel e escopo da persona em uma linha]
  - Tools permitidas: `[read, grep, bash, ...]` (opcional)
  - Model preferido: `[ex: claude-opus-4]` (opcional)
  - _Exemplo: "Security reviewer focused on OWASP Top 10 for any PR touching auth"_
- [ ] **[PKG-A2]** [...]

### Skills

> Guias consultados **automaticamente** pelo agente (cobertura universal).
> `description` ≤ 1024 chars, imperativo ("Use when…"). Corpo < 500 linhas.

- [ ] **[PKG-S1]** `[nome]/SKILL.md` — [Trigger imperativo em uma frase]
  - _Exemplo: "Use when the user asks to run or debug tests in this repository"_
- [ ] **[PKG-S2]** [...]

### Hooks *(opcional — apenas callbacks de lifecycle)*

> Disparam scripts antes/depois de tool calls. **OpenCode não recebe hooks.**
> Se não houver necessidade de hooks, remova esta subseção.

- [ ] **[PKG-H1]** `[nome].json` — Evento: `PreToolUse` | `PostToolUse`
  - Script: `${PLUGIN_ROOT}/scripts/[nome].sh`
  - Targets intencionais: `[copilot, claude, cursor, ...]`

### MCP Servers

> Declarados em `apm.yml → dependencies.mcp:` — não geram arquivos em `.apm/`.
> **NUNCA** tokens/secrets literais — usar `${NOME_DA_VAR}`.

- [ ] **[PKG-M1]** `[nome-ou-registry-id]` — [Para que serve]
  - Forma: `registry` | `self-defined stdio` | `self-defined remote`
  - Secrets necessários: `${[NOME_DA_VAR]}`
- [ ] **[PKG-M2]** [...]

### Checklist — Primitivos (IA executa antes de avançar para Design)

```
[ ] Todos os primitivos necessários identificados e com IDs únicos (PKG-xx)
[ ] Instructions: applyTo definido para cada uma (nenhuma global não intencional)
[ ] Prompts: intent focado, sem ramificações (dividir se necessário)
[ ] Agents: propósito distinto de instructions/prompts
[ ] Skills: triggers imperativos e distintos entre si
[ ] Hooks: apenas se objetivo for callback de runtime (não substituir skills)
[ ] MCP Servers: forma (registry/self-defined) e secrets identificados
[ ] Propósito do Pacote preenchido pelo humano
```

---

## Design dos Primitivos `[IA]`

> Preencha após aprovação humana da seção de Primitivos acima.
> Referencie os IDs PKG-x de cada linha.

### Instructions

| ID      | Arquivo                                    | applyTo          | Escopo da regra      |
|---------|--------------------------------------------|------------------|----------------------|
| PKG-I1  | `.apm/instructions/[nome].instructions.md` | `[glob]`         | [Descrição]          |

> **Regras**: `applyTo` presente em toda instruction de escopo de arquivos.
> Um arquivo = uma regra = um escopo.

### Prompts

| ID      | Arquivo                         | Comando    | Inputs          | allowed-tools | Targets excluídos |
|---------|---------------------------------|------------|-----------------|---------------|-------------------|
| PKG-P1  | `.apm/prompts/[nome].prompt.md` | `/[nome]`  | `param1`        | `[Bash]`      | codex             |

> **Regras**: Inputs seguem `[A-Za-z][\w-]{0,63}`, referenciados como `${input:nome}`.
> Apenas 5 chaves de frontmatter sobrevivem cross-target.

### Agents

| ID      | Arquivo                       | Nome     | model      | tools       | Targets excluídos |
|---------|-------------------------------|----------|------------|-------------|-------------------|
| PKG-A1  | `.apm/agents/[nome].agent.md` | `[nome]` | `[modelo]` | `[read]`    | gemini            |

> **Regras**: Corpo ≤ 300 linhas. Nomes proibidos: `default`, `start`.
> Gemini não recebe agents. Windsurf recebe mas ignora `model:` e `tools:`.

### Skills

| ID      | Diretório             | description (início)            | Body scope              |
|---------|-----------------------|---------------------------------|-------------------------|
| PKG-S1  | `.apm/skills/[nome]/` | `Use when [condição imperativa]`| SKILL.md (+ references) |

> **Regras**: `description` ≤ 1024 chars, imperativo. Corpo < 500 linhas —
> overflow em `references/<topic>.md`. `name:` bate com nome do diretório.

### Hooks *(se aplicável)*

| ID      | Arquivo                  | Evento       | Script                          | Targets excluídos |
|---------|--------------------------|--------------|----------------------------------|-------------------|
| PKG-H1  | `.apm/hooks/[nome].json` | `PreToolUse` | `${PLUGIN_ROOT}/scripts/[x].sh` | opencode          |

> Se não houver hooks, remova esta tabela. Scripts sempre via `${PLUGIN_ROOT}/...`.

### MCP Servers

| ID      | Identificador       | Forma        | Secrets via  | Trust boundary |
|---------|---------------------|--------------|--------------|----------------|
| PKG-M1  | `[registry-id]`     | registry     | —            | transitivo OK  |
| PKG-M2  | `[nome]`            | self-defined | `${API_VAR}` | direto apenas  |

> **Regras**: NUNCA tokens literais. `command` sem espaços (args em `args:`).
> `url` apenas `http(s)://`. Dev/mock servers em `devDependencies.mcp:`.

---

## apm.yml

> Manifesto do pacote. **NUNCA** tokens/secrets literais — usar `${VAR}`.

```yaml
name: "[nome-do-pacote]"
version: "0.1.0"
description: "[O que este pacote entrega ao agente]"

dependencies:
  apm:
    - "[org/pacote@versão]"  # outros pacotes APM necessários (remover se não houver)

  mcp:
    # [PKG-M1] — registry
    - id: "[registry-id]"

    # [PKG-M2] — self-defined remote
    - id: "[nome]"
      registry: false
      url: "https://[host]/mcp"
      headers:
        Authorization: "Bearer ${API_TOKEN}"
```

---

## Estrutura de Arquivos

**Fonte (`.apm/`)**
```
.apm/
├── instructions/
│   └── [nome].instructions.md          # [PKG-I1]
├── prompts/
│   └── [nome].prompt.md               # [PKG-P1]
├── agents/
│   └── [nome].agent.md                # [PKG-A1]
├── skills/
│   └── [nome]/
│       ├── SKILL.md                   # [PKG-S1]
│       └── references/                # overflow de body (se necessário)
├── hooks/
│   └── [nome].json                    # [PKG-H1] — remover se não houver hooks
apm.yml
```

**Output compilado por target (após `apm compile`)**
```
.github/                               ← copilot
├── copilot-instructions.md            # instructions consolidadas
├── prompts/[nome].prompt.md
└── agents/[nome].agent.md

.claude/                               ← claude
├── CLAUDE.md                          # instructions consolidadas
├── commands/[nome].md                 # prompts → /commands
└── agents/[nome].md

.cursor/rules/                         ← cursor
└── [nome].mdc                         # instructions com frontmatter MDC

.codex/                                ← codex (sem prompts, sem hooks)
└── instructions.md
```

---

## Targets Alvo

| Target   | Suportado | Observação |
|----------|-----------|------------|
| copilot  | [Sim/Não] | |
| claude   | [Sim/Não] | |
| cursor   | [Sim/Não] | |
| codex    | [Sim/Não] | [Prompts não chegam — complementar com skill] |
| gemini   | [Sim/Não] | [Agents não chegam] |
| opencode | [Sim/Não] | [Hooks não chegam] |
| windsurf | [Sim/Não] | [model/tools ignorados em agents] |

### Checklist — Design (IA executa antes de avançar para Tasks)

```
[ ] Todas as tabelas de Design preenchidas com IDs PKG-x
[ ] Instructions: applyTo preenchido em cada linha
[ ] Prompts: allowed-tools e targets excluídos declarados
[ ] Agents: modelo e tools declarados; corpo estimado ≤ 300 linhas
[ ] Skills: description imperativa iniciando com "Use when"
[ ] Hooks: targets excluídos incluem opencode
[ ] MCP Servers: secrets via ${VAR}, trust boundary documentado
[ ] apm.yml: nenhum token literal, devDependencies para dev/mock
[ ] Estrutura de arquivos consistente com IDs dos primitivos
[ ] Targets alvo declarados com observações de limitação
```

---

## Tasks de Execução

> **Instrução**: Execute uma task por vez. Após completar, marque `[x]` e
> aguarde aprovação humana antes de prosseguir para a próxima.

---

### T-PKG-01 — Criar Instructions e Agents

**Referências**: [PKG-I1], [PKG-A1], [PKG-H1] — tabelas de Design acima
**Tipo**: PKG / Agent Context

**Subtasks**:
- [ ] [PKG-I1] Criar `.apm/instructions/[nome].instructions.md` com `applyTo` correto
- [ ] Verificar `applyTo` presente em toda instruction de escopo de arquivos
- [ ] Corpo em bullets, não prosa; começa pela regra
- [ ] [PKG-A1] Criar `.apm/agents/[nome].agent.md` com description e role
- [ ] Corpo ≤ 300 linhas, sem replicar instructions globais
- [ ] Nenhum agent com nome `default` ou `start`
- [ ] [PKG-H1] Criar `.apm/hooks/[nome].json` (se PKG-Hx definido)
- [ ] Scripts de hooks usando `${PLUGIN_ROOT}/...`, não caminhos absolutos
- [ ] Rodar `apm compile --validate` para verificar frontmatter

**Critério de conclusão**:
- [ ] Todos os PKG-Ix e PKG-Ax implementados e sem erros de validação
- [ ] Nenhuma instruction virou regra global não intencional

---

### T-PKG-02 — Criar Prompts e Skills

**Referências**: [PKG-P1], [PKG-S1] — tabelas de Design acima
**Tipo**: PKG / Agent Context

**Subtasks**:
- [ ] [PKG-P1] Criar `.apm/prompts/[nome].prompt.md` com frontmatter correto
- [ ] Nomes de input seguem `[A-Za-z][\w-]{0,63}`
- [ ] Inputs referenciados como `${input:nome}` no corpo
- [ ] Apenas as 5 chaves cross-target no frontmatter
- [ ] [PKG-S1] Criar `.apm/skills/[nome]/SKILL.md`
- [ ] `name:` bate com nome do diretório
- [ ] `description` ≤ 1024 chars, imperativa ("Use when…")
- [ ] Body ≤ 500 linhas — overflow em `references/`
- [ ] [Se PKG-Px sem suporte a Codex] Criar skill equivalente para cobertura Codex
- [ ] Rodar `apm audit --file .apm/skills/[nome]/SKILL.md` (scan de hidden-Unicode)
- [ ] Rodar `apm compile --dry-run` para confirmar routing por target

**Critério de conclusão**:
- [ ] Todos os PKG-Px e PKG-Sx implementados
- [ ] Routing por target validado (`--dry-run`)
- [ ] Nenhuma skill com description vaga

---

### T-PKG-03 — Configurar MCP Servers em apm.yml

**Referências**: [PKG-M1], [PKG-M2] — tabela de Design acima
**Tipo**: PKG / Agent Context

**Subtasks**:
- [ ] [PKG-M1] Adicionar entrada registry em `dependencies.mcp:`
- [ ] [PKG-M2] Adicionar entrada self-defined com `transport` e `url`/`command` corretos
- [ ] `command` sem espaços (argumentos em `args:`)
- [ ] `url` usa apenas `http://` ou `https://`
- [ ] **Nenhum** token/secret literal no `apm.yml` — sempre `${VAR}`
- [ ] Servidores de dev/mock em `devDependencies.mcp:`
- [ ] Trust boundary de self-defined transitivos documentado

**Critério de conclusão**:
- [ ] Todos os PKG-Mx declarados no `apm.yml`
- [ ] Nenhum secret literal (revisão de compliance)
- [ ] Secrets necessários (`${VAR}`) documentados no README do pacote

---

### T-PKG-04 — apm install + compile + Validar por Target

**Referências**: Targets Alvo — tabela acima
**Tipo**: PKG / Agent Context

**Subtasks**:
- [ ] Rodar `apm install` e verificar que dependências de apm e mcp foram resolvidas
- [ ] Rodar `apm mcp list` para confirmar que MCP servers chegaram nos harnesses
- [ ] Rodar `apm compile --target copilot` e inspecionar output em `.github/`
- [ ] Rodar `apm compile --target claude` e inspecionar output em `.claude/`
- [ ] Rodar `apm compile` para targets restantes declarados na tabela Targets Alvo
- [ ] Verificar que instructions com `applyTo` não viraram regras globais
- [ ] Verificar que agents não aparecem em Gemini
- [ ] Verificar que hooks não aparecem em OpenCode
- [ ] Testar pelo menos um prompt e uma skill no harness principal

**Critério de conclusão**:
- [ ] Todos os targets alvo compilados sem erros
- [ ] Primitivos visíveis e funcionais no harness principal
- [ ] MCP servers ativos após `apm install`

---

## Checklist de Conformidade (IA verifica antes de finalizar)

```
Primitivos:
  [ ] Instructions (PKG-Ix) com applyTo definido em todas
  [ ] Prompts (PKG-Px) com inputs e allowed-tools declarados
  [ ] Agents (PKG-Ax) com corpo ≤ 300 linhas e sem nomes proibidos
  [ ] Skills (PKG-Sx) com description imperativa ≤ 1024 chars
  [ ] Hooks (PKG-Hx) com ${PLUGIN_ROOT} e sem OpenCode (se aplicável)
  [ ] MCP Servers (PKG-Mx) sem tokens literais

apm.yml:
  [ ] Nenhum token/secret literal
  [ ] Dev/mock servers em devDependencies.mcp:
  [ ] Trust boundary de self-defined documentado

Execução:
  [ ] T-PKG-01: Instructions e agents criados e validados
  [ ] T-PKG-02: Prompts e skills criados, routing confirmado por target
  [ ] T-PKG-03: MCP servers configurados sem secrets literais
  [ ] T-PKG-04: Todos os targets compilados e primitivos testados no harness principal
```
