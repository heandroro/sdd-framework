# Agent Context — SDD Framework Package

> **Sobre este documento**: Define os primitivos APM CLI para publicar o
> SDD Framework como pacote distribuível via `apm install sdd-framework`.
> Qualquer projeto que instalar este pacote recebe o workflow SDD completo
> no agente — instruções, comandos, persona e skill — sem precisar configurar
> manualmente o `AGENTS.md`.
>
> **Instrução para IA**: Preencha as seções marcadas com `[IA]` com base no
> contexto da feature e nas convenções de `apm-standards.md` (Parte 2).
> **NUNCA** inclua tokens/secrets literais — sempre `${VAR}`.
> Ao finalizar cada etapa, execute o checklist correspondente e reporte itens não atendidos.

---

## Propósito do Pacote

Ao instalar `sdd-framework`, o agente de IA passa a conhecer e aplicar o ciclo
Spec-Driven Development completo: instrui-se automaticamente ao editar specs e
o memory bank, expõe comandos `/criar-spec`, `/revisar-spec`, `/gerar-tasks` e
`/promover-adr`, oferece a persona `@sdd` para conduzir o ciclo com aprovação
humana incremental, e possui uma skill consultada universalmente (inclusive no
Codex) com o workflow e os checklists de cada etapa.

---

## Primitivos

> Para cada tipo de primitivo, liste o que será criado e o que cada um faz.
> O design técnico detalhado (tabelas, apm.yml, targets) fica na seção seguinte.
> Consulte `apm-standards.md` (Parte 2) para regras e restrições por tipo.

### Instructions

> Regras acopladas a globs de arquivos — aplicadas automaticamente pelo agente
> quando toca arquivos que casam com `applyTo`.

- [ ] **[PKG-I1]** `sdd-requirements.instructions.md`
  — Regras aplicadas ao editar qualquer `requirements.md` dentro de `.sdd/specs/`:
  nunca incluir detalhes técnicos, separar requisitos funcionais de técnicos,
  preencher seções OBS-x de observabilidade, não avançar sem aprovação humana.
  - Escopo (`applyTo`): `.sdd/specs/**/requirements.md`

- [ ] **[PKG-I2]** `sdd-design.instructions.md`
  — Regras aplicadas ao editar qualquer `design.md` dentro de `.sdd/specs/`:
  verificar alinhamento com `architecture.md`, seção APM Design obrigatória,
  todo OBS-x deve ter APM-Mx ou APM-Ex correspondente, não alterar contratos
  de interface sem aprovação.
  - Escopo (`applyTo`): `.sdd/specs/**/design.md`

- [ ] **[PKG-I3]** `sdd-memory-bank.instructions.md`
  — Regras aplicadas ao editar qualquer arquivo do memory bank: leitura
  obrigatória no início da sessão na ordem correta, `constitution.md` é
  imutável para a IA, promoção de decisões arquiteturais segue o checklist
  de `tasks.md`.
  - Escopo (`applyTo`): `.sdd/memory-bank/**`

### Prompts

> Workflows invocados explicitamente pelo usuário.
> **Codex não recebe prompts** — coberto pelo PKG-S1 (skill).

- [ ] **[PKG-P1]** `criar-spec.prompt.md` — `/criar-spec`
  Gera o `requirements.md` inicial para uma nova feature lendo o memory bank,
  separando requisitos funcionais de técnicos e incluindo as seções OBS-x.
  - Inputs: `feature` (descrição da feature em uma frase)

- [ ] **[PKG-P2]** `revisar-spec.prompt.md` — `/revisar-spec`
  Valida um spec existente: verifica completude dos requisitos, rastreabilidade
  REQ-x.x, cobertura de observabilidade OBS-x↔APM-x e conformidade com
  `constitution.md`. Retorna ✅ / ⚠️ / ❌ com itens de ajuste.
  - Inputs: `etapa` (`requirements` | `design` | `tasks`)

- [ ] **[PKG-P3]** `gerar-tasks.prompt.md` — `/gerar-tasks`
  Gera o `tasks.md` a partir de um `design.md` aprovado, garantindo
  rastreabilidade REQ-x.x e incluindo obrigatoriamente T-APM-01 a T-APM-05.
  - Inputs: `feature` (nome da pasta em `.sdd/specs/`)

- [ ] **[PKG-P4]** `promover-adr.prompt.md` — `/promover-adr`
  Extrai uma decisão arquitetural da sessão atual e registra como ADR em
  `.sdd/adr/ADR-NN-titulo.md` usando o template padrão, atualizando também
  `architecture.md`.
  - Inputs: `decisao` (descrição da decisão em uma frase)

### Agents

> Persona especializada invocada via `@sdd`.
> **Gemini não recebe agents.**

- [ ] **[PKG-A1]** `sdd.agent.md` — `@sdd`
  Persona que conduz o ciclo SDD completo: lê o memory bank, guia o humano
  pelas etapas requirements → design → tasks → validação, aplica os checklists
  de cada etapa, nunca avança sem aprovação humana explícita e reporta qualquer
  conflito com `constitution.md` ou `architecture.md` antes de prosseguir.
  - Tools permitidas: `read_file`, `grep_search`, `file_search`, `create_file`, `replace_string_in_file`
  - Model preferido: nenhum preferido — usa o default do consumidor

### Skills

> Guia consultado automaticamente pelo agente. Cobertura universal (inclui Codex).

- [ ] **[PKG-S1]** `sdd-workflow/SKILL.md`
  — Use when the user is working on files inside `.sdd/` or mentions spec,
  requirements, design, tasks, memory bank, or APM in a spec-driven context.
  Contém o workflow completo, checklists de cada etapa, comportamentos
  proibidos e exemplos de uso do ciclo SDD.

### Hooks

> Não há necessidade de hooks para este pacote. Seção omitida.

### MCP Servers

> Não há dependências de MCP Servers para este pacote. Seção omitida.

### Checklist — Primitivos

```
[x] Todos os primitivos necessários identificados e com IDs únicos (PKG-xx)
[x] Instructions: applyTo definido para cada uma (nenhuma global não intencional)
[x] Prompts: intent focado, sem ramificações (cada prompt = um workflow)
[x] Agents: propósito distinto de instructions/prompts (condução do ciclo, não regras)
[x] Skills: trigger imperativo iniciando com "Use when"
[ ] Hooks: não aplicável — sem necessidade de callbacks de runtime
[ ] MCP Servers: não aplicável — sem dependências externas
[x] Propósito do Pacote preenchido
```

---

## Design dos Primitivos `[IA]`

> Preencher após aprovação humana da seção de Primitivos acima.

### Instructions

| ID      | Arquivo                                                    | applyTo                          | Escopo da regra                                      |
|---------|------------------------------------------------------------|----------------------------------|------------------------------------------------------|
| PKG-I1  | `.apm/instructions/sdd-requirements.instructions.md`       | `.sdd/specs/**/requirements.md`  | Regras de escrita de requisitos funcionais + OBS-x   |
| PKG-I2  | `.apm/instructions/sdd-design.instructions.md`             | `.sdd/specs/**/design.md`        | Regras de design técnico + APM Design obrigatório    |
| PKG-I3  | `.apm/instructions/sdd-memory-bank.instructions.md`        | `.sdd/memory-bank/**`            | Ordem de leitura, imutabilidade, promoção de ADRs    |

### Prompts

| ID      | Arquivo                                    | Comando           | Inputs     | allowed-tools                                                          | Targets excluídos |
|---------|--------------------------------------------|-------------------|------------|------------------------------------------------------------------------|-------------------|
| PKG-P1  | `.apm/prompts/criar-spec.prompt.md`        | `/criar-spec`     | `feature`  | `read_file`, `file_search`, `create_file`                              | codex             |
| PKG-P2  | `.apm/prompts/revisar-spec.prompt.md`      | `/revisar-spec`   | `etapa`    | `read_file`, `grep_search`                                             | codex             |
| PKG-P3  | `.apm/prompts/gerar-tasks.prompt.md`       | `/gerar-tasks`    | `feature`  | `read_file`, `create_file`                                             | codex             |
| PKG-P4  | `.apm/prompts/promover-adr.prompt.md`      | `/promover-adr`   | `decisao`  | `read_file`, `file_search`, `create_file`, `replace_string_in_file`   | codex             |

### Agents

| ID      | Arquivo                        | Nome  | model   | tools                                                                                               | Targets excluídos |
|---------|--------------------------------|-------|---------|-----------------------------------------------------------------------------------------------------|-------------------|
| PKG-A1  | `.apm/agents/sdd.agent.md`     | `sdd` | default | `read_file`, `grep_search`, `file_search`, `create_file`, `replace_string_in_file`, `list_dir`     | gemini            |

### Skills

| ID      | Diretório                        | description (início)                                                                         | Body scope                  |
|---------|----------------------------------|----------------------------------------------------------------------------------------------|-----------------------------|
| PKG-S1  | `.apm/skills/sdd-workflow/`      | `Use when the user is working on files inside .sdd/ or mentions spec, requirements, design…` | SKILL.md (+ references/)    |

### Hooks

> Não aplicável.

### MCP Servers

> Não aplicável.

---

## apm.yml

```yaml
name: "sdd-framework"
version: "0.1.0"
description: "Empacota o workflow Spec-Driven Development (SDD) para agentes de IA. Instala instruções automáticas por glob, comandos /criar-spec /revisar-spec /gerar-tasks /promover-adr, a persona @sdd e a skill sdd-workflow com cobertura universal."

dependencies:
  apm: []
  mcp: []
```

---

## Estrutura de Arquivos

**Fonte (`.apm/`)**
```
.apm/
├── instructions/
│   ├── sdd-requirements.instructions.md    # [PKG-I1]
│   ├── sdd-design.instructions.md          # [PKG-I2]
│   └── sdd-memory-bank.instructions.md     # [PKG-I3]
├── prompts/
│   ├── criar-spec.prompt.md                # [PKG-P1]
│   ├── revisar-spec.prompt.md              # [PKG-P2]
│   ├── gerar-tasks.prompt.md               # [PKG-P3]
│   └── promover-adr.prompt.md              # [PKG-P4]
├── agents/
│   └── sdd.agent.md                        # [PKG-A1]
└── skills/
    └── sdd-workflow/
        ├── SKILL.md                        # [PKG-S1]
        └── references/
            ├── workflow.md                 # ciclo completo SDD (overflow do body)
            └── checklists.md              # checklists de cada etapa (overflow do body)
apm.yml
```

**Output compilado por target (após `apm compile`)**
```
.github/                                    ← copilot
├── instructions/
│   ├── sdd-requirements.instructions.md
│   ├── sdd-design.instructions.md
│   └── sdd-memory-bank.instructions.md
├── prompts/
│   ├── criar-spec.prompt.md
│   ├── revisar-spec.prompt.md
│   ├── gerar-tasks.prompt.md
│   └── promover-adr.prompt.md
└── agents/
    └── sdd.agent.md

.claude/                                    ← claude
├── CLAUDE.md                               # instructions consolidadas
└── commands/
    ├── criar-spec.md
    ├── revisar-spec.md
    ├── gerar-tasks.md
    └── promover-adr.md

.cursor/rules/                              ← cursor
├── sdd-requirements.mdc
├── sdd-design.mdc
└── sdd-memory-bank.mdc

.codex/                                     ← codex (sem prompts)
└── instructions.md
```

---

## Targets Alvo

| Target    | Suportado | Observação                                                    |
|-----------|-----------|---------------------------------------------------------------|
| copilot   | Sim       |                                                               |
| claude    | Sim       | Prompts compilados como `/commands`                           |
| cursor    | Sim       | Instructions compiladas como `.mdc`; agents e skills chegam  |
| codex     | Sim       | Prompts **não chegam** — skill PKG-S1 cobre o gap            |
| gemini    | Sim       | Agent PKG-A1 **não chega** — prompts e skill cobrem          |
| opencode  | Sim       |                                                               |
| windsurf  | Sim       | `model` e `tools` do agent são ignorados                     |

### Checklist — Design

```
[ ] Todas as tabelas de Design preenchidas com IDs PKG-x
[ ] Instructions: applyTo preenchido em cada linha
[ ] Prompts: allowed-tools e targets excluídos declarados
[ ] Agents: modelo e tools declarados; corpo estimado ≤ 300 linhas
[ ] Skills: description imperativa iniciando com "Use when"
[ ] Hooks: não aplicável
[ ] MCP Servers: não aplicável
[ ] apm.yml: nenhum token literal, sem dependências externas
[ ] Estrutura de arquivos consistente com IDs dos primitivos
[ ] Targets alvo declarados com observações de limitação
```

---

## Tasks de Execução

> **Instrução**: Execute uma task por vez. Após completar, marque `[x]` e
> aguarde aprovação humana antes de prosseguir para a próxima.

### T-PKG-01 — Criar Instructions e Agent

**Referências**: [PKG-I1], [PKG-I2], [PKG-I3], [PKG-A1]
**Tipo**: PKG / Agent Context

**Subtasks**:
- [ ] [PKG-I1] Criar `.apm/instructions/sdd-requirements.instructions.md`
- [ ] [PKG-I2] Criar `.apm/instructions/sdd-design.instructions.md`
- [ ] [PKG-I3] Criar `.apm/instructions/sdd-memory-bank.instructions.md`
- [ ] [PKG-A1] Criar `.apm/agents/sdd.agent.md`
- [ ] Verificar `applyTo` presente em todas as instructions
- [ ] Verificar corpo do agent ≤ 300 linhas

---

### T-PKG-02 — Criar Prompts e Skill

**Referências**: [PKG-P1], [PKG-P2], [PKG-P3], [PKG-P4], [PKG-S1]
**Tipo**: PKG / Agent Context

**Subtasks**:
- [ ] [PKG-P1] Criar `.apm/prompts/criar-spec.prompt.md`
- [ ] [PKG-P2] Criar `.apm/prompts/revisar-spec.prompt.md`
- [ ] [PKG-P3] Criar `.apm/prompts/gerar-tasks.prompt.md`
- [ ] [PKG-P4] Criar `.apm/prompts/promover-adr.prompt.md`
- [ ] [PKG-S1] Criar `.apm/skills/sdd-workflow/SKILL.md`
- [ ] [PKG-S1] Criar `.apm/skills/sdd-workflow/references/workflow.md` (overflow do body)
- [ ] [PKG-S1] Criar `.apm/skills/sdd-workflow/references/checklists.md` (overflow do body)
- [ ] Verificar description da skill ≤ 1024 chars e imperativa
- [ ] Verificar corpo da skill ≤ 500 linhas (conteúdo longo em references/)

---

### T-PKG-03 — Criar apm.yml

**Referências**: todos os PKG-x acima
**Tipo**: PKG / Manifesto

**Subtasks**:
- [ ] Criar `apm.yml` na raiz do projeto
- [ ] Verificar ausência de tokens literais
- [ ] Verificar que todos os primitivos estão referenciados implicitamente pela estrutura de pastas

---

### T-PKG-04 — Compilar e Validar

**Referências**: todos os PKG-x, apm.yml
**Tipo**: PKG / Validação

**Subtasks**:
- [ ] Executar `apm compile` e verificar output por target
- [ ] Validar `.github/` (copilot)
- [ ] Validar `.claude/` (claude)
- [ ] Validar `.cursor/rules/` (cursor)
- [ ] Validar `.codex/` (codex)
- [ ] Verificar que skill PKG-S1 cobre os targets sem prompts (codex)
- [ ] Verificar que prompts PKG-P1~P4 cobrem os targets sem agent (gemini)

---

### Checklist de Conformidade Final

```
[ ] T-PKG-01 a T-PKG-04 concluídas e aprovadas pelo humano
[ ] Instructions aplicam-se apenas aos globs intencionais
[ ] Nenhum token/secret literal em nenhum arquivo
[ ] Skill PKG-S1 cobre Codex (sem prompts)
[ ] Prompts PKG-P1~P4 cobrem Gemini (sem agent)
[ ] apm.yml sem dependências externas não aprovadas
[ ] AGENTS.md permanece na raiz como fallback para harnesses sem APM CLI
```
