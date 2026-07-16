# SDD Framework com Agent Package Manager

> Baseado nos princípios de **Spec-Driven Development** explorados por Birgitta Böckeler
> em [Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
> (Martin Fowler, Out/2025), integrado ao **Agent Package Manager**.

<details>
<summary><strong>Índice</strong></summary>

- [O que é Spec-Driven Development (SDD)?](#o-que-é-spec-driven-development-sdd)
  - [O problema](#o-problema)
  - [A solução](#a-solução)
  - [Os três níveis de SDD](#os-três-níveis-de-sdd)
  - [Por que spec-first?](#por-que-spec-first)
- [O que este framework entrega](#o-que-este-framework-entrega)
- [Memory Bank](#memory-bank)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Agent Package Manager (APM CLI)](#agent-package-manager-apm-cli)
- [Fluxo de trabalho](#fluxo-de-trabalho)
  - [Tamanho ideal de problema](#tamanho-ideal-de-problema)
  - [Quebrando features grandes em sub-specs](#quebrando-features-grandes-em-sub-specs)
- [Integração com Application Performance Monitor (Observabilidade)](#integração-com-application-performance-monitor-observabilidade)
- [Como criar uma nova spec](#como-criar-uma-nova-spec)
- [Ciclo de vida do projeto](#ciclo-de-vida-do-projeto)
  - [1. Criação do repositório](#1-criação-do-repositório)
  - [2. Feature nova](#2-feature-nova)
  - [3. Bug fix](#3-bug-fix)
  - [4. Deploy](#4-deploy)
  - [5. Manutenção contínua do memory bank](#5-manutenção-contínua-do-memory-bank)
- [CHANGELOG](#changelog)
- [Commits semânticos](#commits-semânticos)
- [Versionamento](#versionamento)
- [Referências](#referências)
- [Licença](#licença)

</details>

---

## O que é Spec-Driven Development (SDD)?

### O problema

Quando times usam IA para escrever código sem um contexto estruturado, o resultado tende a divergir:
o agente toma decisões que contradizem a arquitetura existente, ignora requisitos não-óbvios e
produz código tecnicamente correto mas funcionalmente errado. A revisão humana torna-se cara
porque o problema só aparece tarde — no código gerado.

### A solução

**Spec-Driven Development** é uma abordagem onde uma _spec_ (especificação estruturada) é
escrita e aprovada **antes** do código existir. A spec funciona como um **contrato explícito
entre o humano e o agente de IA**: define o que deve ser construído, como deve se comportar,
e como será observado em produção.

A ideia central é simples:

> *Escreva o que você quer antes de escrever o como.*

Com a spec em mãos, o agente de IA tem contexto suficiente para implementar com fidelidade.
O humano revisa intenção, não linha de código. Erros de interpretação são detectados na spec
— antes de qualquer código existir.

### Os três níveis de SDD

SDD não é binário. Birgitta Böckeler identifica três níveis, que diferem em como a spec
se relaciona com o código ao longo do tempo:

| Nível | Fluxo | Spec após entrega | Adequado para |
|-------|-------|-------------------|---------------|
| **Spec-First** ← *este framework* | Spec → Código | Descartada (conhecimento vai para o memory bank) | Times ágeis, features de médio porte |
| **Spec-Anchored** | Spec → Código | Mantida como artefato vivo, atualizada a cada mudança | APIs públicas, sistemas regulados |
| **Spec-as-Source** | Spec → Código (IA autônoma) | A spec **é** o código | Scaffolding, boilerplate, prototipagem |

> Para análise detalhada de prós, contras e quando usar cada nível, veja [NIVEL-SDD.md](docs/NIVEL-SDD.md).

> Para entender como a LLM agrega contexto, os riscos da context window e como o framework se integra com diferentes harnesses de IDE, veja [LLM-CONTEXT.md](docs/LLM-CONTEXT.md).

> JIT Spec é uma alternativa ao ciclo SDD completo para mudanças pequenas — não uma etapa dele. Veja [JIT.md](docs/JIT.md).

> Para a documentação completa do Agent Package Manager (APM CLI) — primitivos, ciclo PKG e integração com `.sdd/` — veja [AGENT-PACKAGE-MANAGER.md](docs/AGENT-PACKAGE-MANAGER.md).

> Para entender o SDD Framework pela lente de Harness Engineering (guias, sensores, steering loop), veja [HARNESS-FLOW.md](docs/HARNESS-FLOW.md) e exemplos de sessão em [HARNESS-SESSION.md](docs/HARNESS-SESSION.md).

> Para os diagramas de referência do ciclo SDD completo, veja [SDD-FLOW.md](docs/SDD-FLOW.md); para exemplos de sessão de cada etapa, veja [SDD-SESSION.md](docs/SDD-SESSION.md).

### Por que spec-first?

- **Sem overhead de manutenção**: a spec tem vida curta — guia a implementação e é descartada. Não há risco de spec desatualizada.
- **Compatível com cadência ágil**: um ciclo completo (requirements → design → tasks → entrega) cabe em uma sprint.
- **Memory bank substitui a spec permanente**: o conhecimento que tem valor a longo prazo (decisões arquiteturais, padrões, contexto de produto) é promovido para arquivos persistentes — sem duplicação com o código.
- **Controle humano incremental**: aprovação explícita em cada etapa sem exigir revisão de cada linha gerada.

---

## O que este framework entrega

Este framework é uma estrutura **agnóstica de tecnologia** para praticar SDD com nível
**spec-first**. Além do ciclo básico de spec, o framework inclui:

| Componente | O que é | Onde vive |
|---|---|---|
| **Memory Bank** | Contexto permanente do projeto lido pelo agente no início de toda sessão | `.sdd/memory-bank/` |
| **Ciclo SDD** | Templates e fluxo para requirements → design → tasks com aprovação humana | `.sdd/specs/` |
| **JIT Spec** | Contrato efêmero de artefato único para mudanças pequenas, com um único gate humano | `.sdd/jit/` |
| **Observabilidade obrigatória** | Cada spec define explicitamente métricas, traces, alertas e dashboards | Seções APM-x em `design.md` |
| **Agent Package Manager (APM CLI)** | Ciclo independente para empacotar instruções, prompts e skills para o agente | `.apm/` + `apm.yml` |

---

## Memory Bank

O memory bank é o **contexto permanente do projeto** — lido pelo agente de IA
no início de toda sessão, antes de qualquer ação. Não é um changelog nem uma
documentação de features: é o que **sempre vale**, independente de qual spec
está sendo trabalhada.

| Arquivo | Propósito | Quem mantém |
|---|---|---|
| `constitution.md` | Princípios imutáveis que toda spec e task deve respeitar (ex: observabilidade obrigatória) | Humano — raramente muda |
| `architecture.md` | Decisões arquiteturais estáveis: estilo, C4, ADRs, padrões obrigatórios, dependências aprovadas | Humano — atualizado após cada feature relevante |
| `product.md` | Visão do produto, usuários, objetivos de negócio e KPIs | Humano — atualizado quando o produto evolui |
| `apm-standards.md` | Padrões de observabilidade (naming, tipos de telemetria) e primitivos APM CLI (PKG-x) adotados no projeto | Humano + IA |

> **Regra de ouro**: se uma decisão arquitetural relevante surgir durante a
> execução de uma feature, ela deve ser **promovida para `architecture.md`**
> antes de descartar a spec. O checklist final de `tasks.md` lembra disso.

---

## Estrutura de pastas

> Árvore completa esperada em um projeto que adota SDD + APM CLI(Agent Package Manager)
> A pasta `.apm/` é mantida pelo ciclo Agent Package Manager, independente do ciclo SDD.

```
projeto/
│
├── .apm/                              ← Fonte dos primitivos de agente (APM CLI)
│   ├── instructions/
│   │   └── <nome>.instructions.md     ← Regras aplicadas por glob de arquivos
│   ├── prompts/
│   │   └── <nome>.prompt.md           ← Comandos invocados pelo usuário
│   ├── agents/
│   │   └── <nome>.agent.md            ← Personas @nome especializadas
│   ├── skills/
│   │   └── <nome>/
│   │       ├── SKILL.md               ← Guia consultado automaticamente pelo agente
│   │       └── references/            ← Conteúdo longo extraído do body
│   └── hooks/
│       └── <nome>.json                ← Callbacks PreToolUse/PostToolUse
│
├── .sdd/                              ← Framework SDD (spec-first)
│   ├── memory-bank/                   ← Contexto persistente (todas as tasks)
│   │   ├── constitution.md            ← Princípios imutáveis
│   │   ├── product.md                 ← Contexto de produto e usuários
│   │   ├── architecture.md            ← Decisões arquiteturais
│   │   └── apm-standards.md           ← Padrões Application Performance Monitor (observabilidade) e APM CLI
│   │
│   ├── adr/                           ← Decisões arquiteturais detalhadas
│   │   ├── _template.md               ← Template de ADR (copiar para cada decisão)
│   │   └── ADR-01-titulo.md           ← Uma decisão por arquivo
│   │
│   ├── jit/                           ← Artefatos JIT Spec (efêmeros — mudanças pequenas)
│   │   └── <nome>.md                  ← Um único arquivo, descartado após o merge
│   │
│   └── specs/
│       ├── _template/                 ← Templates base (copiar para cada feature)
│       │   ├── requirements.md        ← Requisitos funcionais + observabilidade
│       │   ├── design.md              ← Design técnico + Observability Design
│       │   ├── tasks.md               ← Tasks de implementação + instrumentação Application Performance Monitor
│       │   └── agent-context.md       ← Ciclo APM CLI independente (opcional)
│       │
│       └── <nome-da-feature>/         ← Spec de uma feature específica
│           ├── requirements.md        ← Aprovado pelo humano
│           ├── design.md              ← Aprovado pelo humano
│           ├── tasks.md               ← Em execução
│           └── agent-context.md       ← Se a feature produz primitivos de agente
│
├── AGENTS.md                          ← Auto-descoberto por agentes de IA (deve estar na raiz)
├── apm.yml                            ← Manifesto do pacote APM CLI
│
├── docs/                              ← Documentação de referência (níveis SDD, JIT, harness, APM CLI...)
│   └── ...
│
└── src/                               ← Código da aplicação
    └── ...
```

---

## Agent Package Manager (APM CLI)

O APM CLI é um **ciclo independente do SDD** que empacota contexto e
comportamento para o agente de IA (Instructions, Prompts, Agents, Skills,
Hooks) e pode ser executado antes, em paralelo ou depois do ciclo SDD.

Para os cinco tipos de primitivo com exemplos, o ciclo PKG-1 → PKG-2 → PKG-3
e como `.sdd/` e `.apm/` se integram, veja **[AGENT-PACKAGE-MANAGER.md](docs/AGENT-PACKAGE-MANAGER.md)**.

---

## Fluxo de trabalho

**Ciclo SDD** (spec-first, sequencial com aprovação humana em cada etapa):

```
 ┌──────────────────┐
 │  1. REQUIREMENTS │  → Requisitos funcionais + observabilidade (OBS-x)
 └────────┬─────────┘
          │  Revisão humana obrigatória
          ▼
 ┌──────────────────┐
 │  2. DESIGN       │  → Design técnico + Observability Design (APM-Mx, APM-Ex)
 └────────┬─────────┘
          │  Revisão humana obrigatória
          ▼
 ┌──────────────────┐
 │  3. TASKS        │  → Tasks de implementação + T-APM-01 a T-APM-05 (obrigatórias)
 └────────┬─────────┘
          │  Execução task-a-task com revisão incremental
          ▼
 ┌──────────────────┐
 │  4. VALIDAÇÃO    │  → Application Performance Monitor: métricas, alertas, dashboards implementados
 └──────────────────┘
```

### Tamanho ideal de problema

SDD introduz overhead cognitivo — o rigor deve ser proporcional ao tamanho do
problema. Antes de começar, decida qual dos três caminhos a mudança segue —
eles são **alternativos**, nunca combinados:

| Tamanho         | Recomendação                                                        |
|-----------------|---------------------------------------------------------------------|
| Mudança trivial | Sem spec — direto ao código com IA (typo, comentário, ajuste cosmético) |
| Mudança pequena | **JIT Spec** — contrato de artefato único, 1 gate humano (ver [JIT.md](docs/JIT.md)) |
| Feature média   | **Ciclo completo** (requirements → design → tasks)                  |
| Feature grande  | Quebre em múltiplas specs menores (ver abaixo)                      |
| Produto novo    | Comece pelo memory bank; depois uma spec por feature                |

Para o fluxo completo do JIT Spec — elegibilidade, regras do artefato,
exemplo preenchido e comparação lado a lado com o ciclo SDD completo — veja
**[JIT.md](docs/JIT.md)**.

#### Quebrando features grandes em sub-specs

Quando uma feature for grande demais para um único spec, crie um subdiretório
por componente independente. Cada sub-spec tem seu próprio ciclo SDD completo:

```
.sdd/specs/
  checkout/                ← spec de alto nível (orienta, não executa)
    requirements.md        ← escopo geral e dependências entre sub-specs
    design.md              ← arquitetura da feature como um todo
  checkout-pagamento/      ← sub-spec com ciclo SDD próprio
    requirements.md
    design.md
    tasks.md
  checkout-carrinho/       ← sub-spec com ciclo SDD próprio
    requirements.md
    design.md
    tasks.md
```

> **Sinal de que uma feature deve ser quebrada**: `tasks.md` com mais de 10 tasks,
> ou `design.md` com mais de 2 domínios de negócio distintos.
> O `tasks.md` dentro de cada sub-spec permanece um **arquivo único** —
> a divisão é por escopo de feature, não por volume de tasks.

---

## Integração com Application Performance Monitor (Observabilidade)

Todo spec neste framework inclui uma seção de **Observability Design** que define:

- **Telemetria obrigatória**: traces distribuídos, métricas customizadas, eventos de negócio, exceções
- **SLOs (Service Level Objectives)**: thresholds de latência, taxa de erro e disponibilidade
- **Condições de alerta**: regras com severidade, impacto e runbook
- **Conceito de dashboard**: KPIs operacionais e de negócio visíveis para o time

O framework é agnóstico de plataforma. Os padrões específicos do projeto
(plataforma Application Performance Monitor adotada, naming conventions, IDs) ficam centralizados em
`.sdd/memory-bank/apm-standards.md`.

---

## Como criar uma nova spec

```bash
# Ciclo SDD
cp -r .sdd/specs/_template .sdd/specs/<nome-da-feature>

# 1. Preencha requirements.md com a IA → Revise e aprove
# 2. Preencha design.md com a IA → Revise e aprove
# 3. Gere tasks.md com a IA → Execute task a task
# 4. Ao finalizar, valide Application Performance Monitor e descarte a spec (spec-first)

# Ciclo APM CLI (se a feature produz primitivos de agente — independente do SDD)
# O agent-context.md já está no template copiado acima
# 1. Preencha a seção Primitivos → Aprove
# 2. Preencha o Design dos Primitivos → Aprove
# 3. Execute T-PKG-01 a T-PKG-04 → apm install && apm compile
```

---

## Ciclo de vida do projeto

### 1. Criação do repositório

Passos para adotar o framework em um projeto novo:

```
1. Crie o repositório e clone localmente
2. Copie a pasta .sdd/ para a raiz do projeto
3. Preencha o memory bank (humano):
   a. constitution.md  — ajuste ou mantenha os princípios padrão
   b. product.md       — descreva o produto, usuários e objetivos de negócio
   c. architecture.md  — defina estilo arquitetural, C4 Level 1 e 2, ADRs iniciais
   d. apm-standards.md — escolha a plataforma APM e defina naming conventions
4. (Opcional) Configure o ciclo APM CLI:
   a. Inicialize: apm init
   b. Preencha agent-context.md para o contexto base do projeto
   c. Execute: apm install && apm compile
5. Faça commit do estado inicial do memory bank
```

### 2. Feature nova

```
1. Crie a branch: git checkout -b feat/<nome>
2. Copie o template: cp -r .sdd/specs/_template .sdd/specs/<nome>
3. Ciclo SDD:
   requirements.md → aprovação → design.md → aprovação → tasks.md → execução
4. (Se aplicável) Ciclo APM CLI em paralelo:
   agent-context.md → PKG-1 → PKG-2 → PKG-3
5. Valide Application Performance Monitor antes do merge:
   [ ] Métricas e eventos visíveis na plataforma Application Performance Monitor
   [ ] Alertas configurados e testados
   [ ] Dashboard atualizado
6. Pull Request → Code Review → Merge
7. Atualize o CHANGELOG.md com a seção `Added` (ou `Changed` se for modificação)
8. Descarte a spec (spec-first) ou arquive se houver valor histórico
9. Promova decisões arquiteturais relevantes para architecture.md
```

### 3. Bug fix

> Bug fixes geralmente **não justificam** o ciclo SDD completo.
> Use a tabela de tamanho de problema como guia: trivial → direto ao código,
> pequeno → **JIT Spec**, complexo → mini-spec.
>
> **Artefatos permanentes de um bug fix:**
> - Commit message (sempre)
> - Entrada `Fixed` no CHANGELOG (obrigatório)
> - ADR (somente se a correção implicou em mudança arquitetural)
> — Spec, mini-spec e artefato JIT são sempre descartados após o merge

```
Bug trivial (typo, ajuste cosmético, sem mudança de comportamento):
  1. Crie a branch: git checkout -b fix/<nome>
  2. Corrija e teste — sem spec
  3. Pull Request → Merge

Bug pequeno (causa conhecida, mudança localizada) — use o fluxo JIT Spec:
  1. Crie a branch: git checkout -b fix/<nome>
  2. Gere o JIT Spec (artefato único derivado do memory bank) → aprovação humana
  3. Corrija, teste e valide que a telemetria Application Performance Monitor existente cobre o cenário
  4. Pull Request → Merge → Descarte o artefato JIT
  — Se durante a correção surgir decisão arquitetural ou necessidade de
     telemetria nova, pare e promova para spec completa (regra de escalada)

Bug complexo (causa desconhecida, impacto amplo):
  1. Crie a branch: git checkout -b fix/<nome>
  2. Crie um mini-spec em .sdd/specs/<nome>/design.md descrevendo:
     - Hipótese da causa raiz
     - Componentes afetados
     - Abordagem de correção
  3. Execute as tasks de correção
  4. Valide com Application Performance Monitor: verifique que o evento/trace problemático sumiu
  5. Pull Request → Merge → Descarte o mini-spec
  — Se a correção mudou uma decisão arquitetural (ex: adotou circuit breaker,
     trocou estratégia de retry), registre um ADR antes de descartar o mini-spec
```

### 4. Deploy

```
Pré-deploy (checklist mínimo):
  [ ] Todas as tasks T-APM-xx concluídas e validadas em staging
  [ ] Alertas configurados (não deployar sem alertas ativos)
  [ ] Feature flag definida (se aplicável)
  [ ] Rollback plan documentado no design.md

Deploy:
  1. Merge para a branch principal
  2. Pipeline CI/CD executa testes e build
  3. Deploy em staging → smoke test com Application Performance Monitor aberto
  4. Deploy em produção → monitorar dashboard por [período definido em design.md]

Pós-deploy:
  [ ] Dashboard mostrando dados reais de produção
  [ ] Nenhum alerta disparado inesperadamente
  [ ] SLOs dentro dos thresholds definidos no design.md
```

### 5. Manutenção contínua do memory bank

```
Após cada feature/bug relevante:
  [ ] Novas decisões arquiteturais → architecture.md (ADRs)
  [ ] Mudanças no modelo de domínio → architecture.md (C4 Level 2)
  [ ] Novos padrões de telemetria adotados → apm-standards.md
  [ ] Mudanças no produto/usuários → product.md

Periodicidade sugerida:
  - Revisão do memory bank a cada ciclo de release
  - ADRs: registrar no momento da decisão, nunca retroativamente
```

---

## CHANGELOG

O `CHANGELOG.md` é **obrigatório** em todo projeto que adota este framework.
Siga o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) com as seções:

| Seção | Quando usar |
|---------|-------------|
| `Added` | Nova feature ou comportamento adicionado |
| `Changed` | Mudança em comportamento existente |
| `Deprecated` | Feature que será removida em versões futuras |
| `Removed` | Feature removida |
| `Fixed` | Correção de bug |
| `Security` | Correção de vulnerabilidade |

> **ADRs vs. CHANGELOG**: os ADRs cobrem *decisões arquiteturais* com contexto rico
> (por que, alternativas, consequências). O CHANGELOG cobre *mudanças incrementais*
> cronologicamente. São complementares, não substitutos.

**Quando atualizar**:
- Feature nova → `Added` no merge para a branch principal
- Bug fix → `Fixed` no merge
- Decisão arquitetural → ADR (não vai para o CHANGELOG)

## Commits semânticos

Todo commit deve seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/).
Os prefixos mapeiam diretamente para as seções do CHANGELOG:

| Prefixo | Seção CHANGELOG | Quando usar |
|---------|-----------------|-------------|
| `feat:` | `Added` | Nova feature ou comportamento |
| `fix:` | `Fixed` | Correção de bug |
| `chore:` | — | Manutenção sem impacto funcional (deps, build, config) |
| `docs:` | — | Documentação apenas |
| `refactor:` | `Changed` | Refatoração sem mudança de comportamento |
| `perf:` | `Changed` | Melhoria de performance |
| `test:` | — | Adição ou correção de testes |
| `apm:` | — | Instrumentação APM (traces, métricas, alertas, dashboard) |

Use `!` para breaking changes: `feat!: remove endpoint legado`

> **Recomendado**: configure um hook de `commit-msg` (via git hooks ou ferramenta de sua escolha)
> para validar automaticamente as mensagens contra o padrão Conventional Commits,
> e um gerador de CHANGELOG a partir do histórico git.

## Versionamento

Este framework adota **[Semantic Versioning](https://semver.org/lang/pt-BR/)** (`MAJOR.MINOR.PATCH`),
derivado diretamente dos commits semânticos:

| Evento no git | Impacto na versão | Como declarar |
|---------------|-------------------|---------------|
| `fix:` | `PATCH` — 0.0.**x** | Commit normal |
| `feat:` | `MINOR` — 0.**x**.0 | Commit normal |
| Qualquer prefixo com `!` ou footer `BREAKING CHANGE:` | `MAJOR` — **x**.0.0 | `feat!:` ou `fix!:` |

**Fluxo de release:**

```
1. Commits do ciclo SDD seguem Conventional Commits
2. No release: bump de versão derivado automaticamente dos commits desde a última tag
3. CHANGELOG.md atualizado com as entradas do período
4. Tag git criada: vMAJOR.MINOR.PATCH
```

> **Recomendado**: automatize os passos 2–4 com uma ferramenta de release
> (baseada em Conventional Commits) integrada ao CI/CD.

> **Versão 0.x.x**: enquanto o projeto está em desenvolvimento inicial,
> `MAJOR=0` indica que a API pública ainda não é estável — breaking changes
> podem ocorrer em `MINOR`.

---

## Referências

- [NIVEL-SDD.md](docs/NIVEL-SDD.md) — Análise comparativa dos três níveis SDD (prós, contras, quando usar)
- [JIT.md](docs/JIT.md) — JIT Spec: alternativa leve ao ciclo SDD completo para mudanças pequenas
- [AGENT-PACKAGE-MANAGER.md](docs/AGENT-PACKAGE-MANAGER.md) — Agent Package Manager (APM CLI): primitivos, ciclo PKG e integração com `.sdd/`
- [SDD-FLOW.md](docs/SDD-FLOW.md) — Diagramas de referência do ciclo SDD completo
- [SDD-SESSION.md](docs/SDD-SESSION.md) — Exemplos de sessão para cada etapa do ciclo SDD
- [HARNESS-FLOW.md](docs/HARNESS-FLOW.md) — SDD Framework pela lente de Harness Engineering: guias, sensores e steering loop
- [HARNESS-SESSION.md](docs/HARNESS-SESSION.md) — Exemplos de sessão mostrando guias e sensores do harness em ação
- [Spec-Driven Development — Birgitta Böckeler (martinfowler.com)](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html)
- [GitHub spec-kit](https://github.com/github/spec-kit)
- [Kiro](https://kiro.dev/)
- [Tessl Framework](https://docs.tessl.io/)

**Agent Package Manager**
- [Agent Package Manager (APM CLI) — repositório oficial](https://github.com/microsoft/apm)
- [Documentação de primitivos](https://github.com/microsoft/apm/blob/main/docs/primitives.md)
- [apm.yml — referência do manifesto](https://github.com/microsoft/apm/blob/main/docs/apm-yml.md)

---

## Licença

MIT License

Copyright (c) 2026 Leandro Yamaniha

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
