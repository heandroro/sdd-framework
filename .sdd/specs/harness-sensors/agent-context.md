# Agent Context — Harness Sensors (`sdd-validate`)

> **Sobre este documento**: Define os primitivos APM CLI para empacotar o
> uso do `sdd-validate` (o CLI implementado nesta spec) como parte do
> workflow SDD já distribuído pelo pacote `sdd-framework`. Diferente do
> `sdd-package` (que define o pacote inteiro do zero), aqui o objetivo é
> **integrar** um sensor novo a primitivos que já existem.
>
> **Instrução para IA**: Preencha as seções marcadas com `[IA]` com base no
> contrato já fechado em `design.md` (CLI args, exit codes, schema JSON).
> **NUNCA** inclua tokens/secrets literais — sempre `${VAR}`.

---

## Propósito do Pacote

O `sdd-validate` é o primeiro sensor computacional do harness (ver
`docs/HARNESS-FLOW.md`), mas só tem valor prático se o agente souber
**quando e como invocá-lo** durante o ciclo SDD. Este agent-context define:
um novo comando `/validar-spec` que roda o CLI e interpreta o resultado, e
uma atualização da skill `sdd-workflow` já existente para orientar o agente
a rodar o validador antes de `/revisar-spec` e depois de `/gerar-tasks` —
fechando o gap que `references/workflow.md` já antecipava ("valide com o
perfil leve do validador de specs — quando disponível").

Decisão já tomada (não repetir no gate): `sdd-validate` é integrado
**atualizando a skill `sdd-workflow`**, não como skill nova — é um sensor
*para* o workflow, não uma preocupação independente.

---

## Primitivos

### Prompts

- [x] **[PKG-P1]** `validar-spec.prompt.md` — `/validar-spec`
  Roda `sdd-validate` contra a spec ativa (ou against `target-dir`
  informado) e interpreta a saída para o humano/agente, retornando o mesmo
  contrato ✅/⚠️/❌ usado por `/revisar-spec`.
  - Inputs: `alvo` (opcional — pasta da spec ou repositório; default: raiz
    do repositório, valida todas as specs em `.sdd/specs/`)

### Skills

- [x] **[PKG-S1]** Atualizar `sdd-workflow/SKILL.md` + `references/workflow.md`
  — adicionar orientação: rodar `sdd-validate` antes de `/revisar-spec` e
  após `/gerar-tasks`, como pré-checagem determinística antes do gate humano.
  Não é uma skill nova — é uma atualização pontual da existente.

### Instructions / Agents / Hooks / MCP Servers

> Não aplicável — este agent-context só adiciona um prompt e atualiza uma
> skill já existente; nenhum outro tipo de primitivo é necessário.

### Checklist — Primitivos

```
[x] Todos os primitivos necessários identificados e com IDs únicos (PKG-xx)
[x] Prompts: intent focado, sem ramificações (um prompt = um workflow)
[x] Skills: mudança é uma atualização pontual, não uma skill nova (decisão já aprovada)
[x] Propósito do Pacote preenchido
```

---

## Design dos Primitivos

### Prompts

| ID     | Arquivo                              | Comando          | Inputs | allowed-tools | Targets excluídos |
|--------|---------------------------------------|-------------------|--------|---------------|--------------------|
| PKG-P1 | `.apm/prompts/validar-spec.prompt.md` | `/validar-spec`   | `alvo` | `Bash`, `Read` | codex              |

`Bash` é necessário aqui pela primeira vez entre os prompts deste pacote —
é o único jeito de invocar o binário `sdd-validate` (nenhum outro prompt do
`sdd-framework` precisa rodar um processo externo).

### Skills

| ID     | Diretório                   | Mudança                                                                 |
|--------|------------------------------|--------------------------------------------------------------------------|
| PKG-S1 | `.apm/skills/sdd-workflow/`  | Adiciona seção "Validação automática" ao `SKILL.md`; torna concreta a linha 42 de `references/workflow.md` (hoje "quando disponível") |

### apm.yml

```yaml
name: "sdd-framework"
version: "0.2.0"
description: "Empacota o workflow Spec-Driven Development (SDD) para agentes de IA. Instala instruções automáticas por glob, comandos /criar-spec /revisar-spec /gerar-tasks /promover-adr /validar-spec, a persona @sdd e a skill sdd-workflow (com sensor computacional sdd-validate) com cobertura universal."

dependencies:
  apm: []
  mcp:
    - name: io.github.github/github-mcp-server
      tools: ["get_file_contents", "search_code"]
      env:
        GITHUB_TOKEN: "${GITHUB_TOKEN}"
```

Bump `0.1.0` → `0.2.0`: novo primitivo (prompt) + mudança de comportamento
de um primitivo existente (skill) — não é só um patch de documentação.

---

## Estrutura de Arquivos

**Fonte (`.apm/`, incremental sobre o que já existe)**
```
.apm/
├── prompts/
│   └── validar-spec.prompt.md          # [PKG-P1] — NOVO
└── skills/
    └── sdd-workflow/
        ├── SKILL.md                    # [PKG-S1] — ATUALIZADO
        └── references/
            └── workflow.md             # [PKG-S1] — ATUALIZADO (linha 42)
apm.yml                                  # ATUALIZADO (versão + descrição)
```

**Código-fonte do sensor (fora do `.apm/`, não é primitivo APM)**
```
tools/sdd-validate/                      # o CLI em si — ver design.md
```

---

## Targets Alvo

| Target    | Suportado | Observação                                            |
|-----------|-----------|--------------------------------------------------------|
| copilot   | Sim       |                                                        |
| claude    | Sim       | Prompt compilado como `/command`                       |
| cursor    | Sim       | Skill chega normalmente                                |
| codex     | Sim       | Prompt **não chega** — skill `sdd-workflow` cobre o gap|
| gemini    | Sim       |                                                        |
| opencode  | Sim       |                                                        |
| windsurf  | Sim       |                                                        |

### Checklist — Design

```
[x] Tabela de Design preenchida com IDs PKG-x
[x] Prompts: allowed-tools e targets excluídos declarados
[x] Skills: mudança descrita, sem gatilho novo (reaproveita "Use when" existente)
[x] apm.yml: nenhum token literal
[x] Estrutura de arquivos consistente com IDs dos primitivos
[x] Targets alvo declarados com observações de limitação
```

---

## Tasks de Execução

> **Instrução**: Execute uma task por vez. Após completar, marque `[x]` e
> aguarde aprovação humana antes de prosseguir para a próxima.

### T-PKG-01 — Criar o prompt `/validar-spec`

**Referências**: [PKG-P1]
**Tipo**: PKG / Agent Context

**Subtasks**:
- [ ] [PKG-P1] Criar `.apm/prompts/validar-spec.prompt.md`
- [ ] Verificar `allowed-tools` inclui `Bash` e `Read`
- [ ] Verificar que o prompt segue o mesmo contrato ✅/⚠️/❌ de `revisar-spec.prompt.md`

---

### T-PKG-02 — Atualizar a skill `sdd-workflow`

**Referências**: [PKG-S1]
**Tipo**: PKG / Agent Context

**Subtasks**:
- [ ] [PKG-S1] Adicionar seção "Validação automática" a `SKILL.md`
- [ ] [PKG-S1] Tornar concreta a linha "quando disponível" em `references/workflow.md`
- [ ] Verificar que a mudança não quebra o limite de tamanho do corpo da skill

---

### T-PKG-03 — Atualizar `apm.yml`

**Referências**: todos os PKG-x acima

**Subtasks**:
- [ ] Bump de versão `0.1.0` → `0.2.0`
- [ ] Atualizar descrição mencionando `/validar-spec`
- [ ] Verificar ausência de tokens literais

---

### T-PKG-04 — Compilar e validar

**Referências**: todos os PKG-x, `apm.yml`

**Subtasks**:
- [ ] Executar `apm compile` (se o APM CLI estiver disponível no ambiente) e verificar output por target
- [ ] Verificar que a skill `sdd-workflow` atualizada cobre Codex (sem prompt)
- [ ] Testar `/validar-spec` manualmente contra uma spec real e uma quebrada

---

### Checklist de Conformidade Final

```
[ ] T-PKG-01 a T-PKG-04 concluídas e aprovadas pelo humano
[ ] Nenhum token/secret literal em nenhum arquivo
[ ] Skill sdd-workflow cobre Codex (sem prompt) — inalterado desde sdd-package
[ ] apm.yml sem dependências externas não aprovadas além das já existentes
[ ] AGENTS.md permanece na raiz como fallback para harnesses sem APM CLI
```
