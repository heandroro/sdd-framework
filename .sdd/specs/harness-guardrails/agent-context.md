# Agent Context — Harness Guardrails

> **Sobre este documento**: Define o primeiro Hook do projeto — um
> guardrail *enforced* (bloqueia a ação, não só orienta por texto). É
> independente do ciclo SDD; não há `requirements.md`/`design.md`/`tasks.md`
> para esta feature, só este agent-context.md.

---

## Propósito do Pacote

Hoje `constitution.md` é "imutável para a IA" só por uma instruction
(`.apm/instructions/sdd-constitution.instructions.md`) — orientação que o
agente segue por disciplina, não algo que é tecnicamente bloqueado. Este
pacote adiciona o primeiro **Hook** do projeto: um `PreToolUse` que
bloqueia de fato qualquer tentativa de escrita direta em
`constitution.md`, fechando a lacuna que o quadrante HARNESS da skill
`sdd-workflow` já documenta (guardrails hoje são só orientação; guardrails
*enforced* mapeiam para Hooks, primitivo ainda não usado neste repo).

---

## Primitivos

> Só Hooks nesta entrega — Instructions, Prompts, Agents, Skills e MCP
> Servers não se aplicam (nenhuma necessidade identificada) e ficam
> omitidos, conforme a instrução do template.

### Hooks

- [x] **[PKG-H1]** `proteger-constitution.json` — Evento: `PreToolUse`
  - Bloqueia qualquer escrita/edição cujo filepath contenha
    `.sdd/memory-bank/constitution.md`
  - Mensagem de bloqueio: explica que `constitution.md` é imutável para a
    IA e que só o humano pode editar diretamente
  - Targets intencionais: todos exceto `opencode` (não recebe hooks — ver
    `docs/AGENT-PACKAGE-MANAGER.md` e `.sdd/specs/_template/agent-context.md`)

### Checklist — Primitivos

```
[x] Todos os primitivos necessários identificados e com IDs únicos (PKG-xx)
[x] Hooks: objetivo é callback de runtime real (bloqueio), não substitui a
    instruction existente — reforça, não remove
[x] Propósito do Pacote preenchido
[x] Instructions/Prompts/Agents/Skills/MCP Servers: nenhum necessário —
    seções omitidas intencionalmente, não esquecidas
```

---

## Design dos Primitivos

### Hooks

| ID     | Arquivo                              | Evento       | Ação                                | Targets excluídos |
|--------|----------------------------------------|--------------|--------------------------------------|--------------------|
| PKG-H1 | `.apm/hooks/proteger-constitution.json` | `PreToolUse` | `block` inline (condição + mensagem) | `opencode`         |

**Schema real, confirmado empiricamente contra `apm install`/`compile`**
(nem a forma "lista" nem a forma "script" documentadas eram exatas — nenhuma
das duas fontes internas descrevia o formato certo). Descoberto por
tentativa/observação/ajuste (3 rodadas, dentro do limite do LOOP — ver
`docs/LOOP.md`):

1. `"hooks": [ {...} ]` (lista) → rejeitado: *"'hooks' must be a dict, got list"*
2. `"hooks": { "<id-arbitrário>": {"type": "PreToolUse", ...} }` → aceito
   estruturalmente, mas *"contributed no entries... all events empty or
   non-list"* — o valor de cada eventos precisa ser uma **lista**
3. `"hooks": { "PreToolUse": [ {...}, {...} ] }` (dict com o evento como
   chave, valor é lista de definições, sem `type` dentro de cada uma) →
   **aceito**: `"1 hook(s) integrated -> .claude/settings.json"`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "tool": "write_file",
        "condition": "filepath contains '.sdd/memory-bank/constitution.md'",
        "action": "block",
        "message": "constitution.md é imutável para a IA — princípios só podem ser alterados diretamente pelo humano. Peça para o humano fazer essa edição."
      },
      {
        "tool": "edit_file",
        "condition": "filepath contains '.sdd/memory-bank/constitution.md'",
        "action": "block",
        "message": "constitution.md é imutável para a IA — princípios só podem ser alterados diretamente pelo humano. Peça para o humano fazer essa edição."
      }
    ]
  }
}
```

Duas entradas (`write_file` e `edit_file`) por incerteza sobre se um único
nome de tool cobre os dois casos — mais seguro cobrir ambos.

> **Risco não resolvido**: o JSON acima compilou sem erro para
> `.claude/settings.json`, mas o formato nativo real de hooks do Claude
> Code costuma ser `matcher` + `hooks[].type:"command"` (executando um
> script), não `tool`/`condition`/`action`/`message` diretamente. É
> possível que o compilador do `apm` para o target `claude` ainda não
> traduza o schema abstrato do APM para o formato nativo — ou seja, "compilou
> sem erro" não é prova de que o Claude Code vai *de fato* interpretar e
> aplicar o bloqueio. Verificação funcional real fica pendente (ver Tasks).

---

## apm.yml

```yaml
name: "sdd-framework"
version: "0.3.0"
description: "Empacota o workflow Spec-Driven Development (SDD) para agentes de IA. Instala instruções automáticas por glob, comandos /criar-spec /revisar-spec /gerar-tasks /promover-adr /validar-spec, a persona @sdd, a skill sdd-workflow (com o sensor computacional sdd-validate) com cobertura universal incluindo Codex, e o hook proteger-constitution (bloqueia escrita direta em constitution.md)."

dependencies:
  apm: []
  mcp:
    - name: io.github.github/github-mcp-server
      tools: ["get_file_contents", "search_code"]
      env:
        GITHUB_TOKEN: "${GITHUB_TOKEN}"
```

Bump `0.2.0` → `0.3.0`: novo tipo de primitivo (Hooks) introduzido pela
primeira vez no projeto — mudança de comportamento real (bloqueio), não só
documentação.

---

## Estrutura de Arquivos

```
.apm/
└── hooks/
    └── proteger-constitution.json      # [PKG-H1] — NOVO, primeiro hook do projeto
apm.yml                                  # ATUALIZADO (versão + descrição)
```

---

## Targets Alvo

| Target    | Recebe o hook? | Observação                                   |
|-----------|-----------------|-----------------------------------------------|
| copilot   | Sim             |                                                 |
| claude    | Sim             |                                                 |
| cursor    | Sim             |                                                 |
| codex     | Sim             | Codex não recebe *prompts*, mas recebe hooks  |
| gemini    | Sim             |                                                 |
| opencode  | **Não**         | OpenCode não recebe hooks (limitação documentada) |
| windsurf  | Sim             |                                                 |

### Checklist — Design

```
[x] Tabela de Design preenchida com ID PKG-H1
[x] Hooks: targets excluídos incluem opencode
[x] apm.yml: nenhum token literal
[x] Estrutura de arquivos consistente com o ID do primitivo
[x] Targets alvo declarados com observações de limitação
[x] Schema do hook confirmado contra apm install — dict {evento: [entradas]}
```

---

## Tasks de Execução

### T-PKG-01 — Criar o Hook

**Referências**: [PKG-H1]

**Subtasks**:
- [x] Criar `.apm/hooks/proteger-constitution.json`
- [x] Descobrir o schema real por tentativa/observação/ajuste (3 rodadas)
- [x] Atualizar `apm.yml` (versão + descrição)

**Critério de conclusão**:
- [x] `.apm/hooks/proteger-constitution.json` existe com o schema aceito pelo `apm install`

---

### T-PKG-04 — Compilar e Validar

**Referências**: Targets Alvo — tabela acima

**Subtasks**:
- [x] Rodar `apm install --only apm` e confirmar `"1 hook(s) integrated -> .claude/settings.json"`
- [x] Rodar `apm compile --target opencode --dry-run` e confirmar que nenhum
  caminho de hooks aparece na saída (exclusão respeitada)
- [ ] **Teste funcional real**: confirmar, numa sessão nova (hooks carregam
  na inicialização), que uma tentativa de editar `constitution.md` é
  efetivamente bloqueada pelo Claude Code — **pendente, decisão do usuário
  foi testar manualmente** (não tentei editar o arquivo real por dois
  motivos: risco de o schema compilado não corresponder ao formato nativo
  de hooks do Claude Code, e conflito direto com a instruction
  `sdd-constitution.instructions.md`, que proíbe qualquer edição do
  arquivo por iniciativa própria — mesmo como teste)

**Critério de conclusão**:
- [x] Hook compila sem erro e é roteado corretamente (presente nos targets
  esperados, ausente em `opencode`)
- [ ] Bloqueio funcional confirmado em uso real — **pendente**

---

## Checklist de Conformidade

```
Primitivos:
  [x] Hooks (PKG-H1) com schema confirmado e targets excluídos corretos

apm.yml:
  [x] Nenhum token/secret literal
  [x] Versão incrementada (0.2.0 -> 0.3.0)

Execução:
  [x] T-PKG-01: Hook criado e schema validado
  [x] T-PKG-04 (parcial): compilado e roteamento por target confirmado
  [ ] T-PKG-04 (pendente): bloqueio funcional testado numa sessão nova —
      aguardando teste manual do usuário; instruction existente
      (sdd-constitution.instructions.md) continua sendo a camada de
      proteção confirmada até essa validação acontecer
```
