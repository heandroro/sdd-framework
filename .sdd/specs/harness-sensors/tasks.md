# Tasks — Harness Sensors (Spec Validation)

> **Pré-condição**: `design.md` aprovado.
>
> **Instrução de execução**: Execute uma task por vez. Após completar,
> marque `[x]` e aguarde aprovação humana antes de prosseguir.

---

## Resumo de Tasks

| ID         | Task                                         | Tipo            | Refs                            | Status |
|------------|----------------------------------------------|-----------------|---------------------------------|--------|
| T-IMP-01   | Escolher runtime e scaffoldar projeto        | Implementação   | REQ-1.4, REQ NFR Portabilidade  | `[x]`  |
| T-IMP-02   | Implementar `MarkdownParser`                 | Implementação   | REQ-1.1–1.8                     | `[x]`  |
| T-IMP-03   | Implementar `SpecDiscovery`                  | Implementação   | REQ-2.3, REQ-3.1                | `[x]`  |
| T-IMP-04   | Implementar regras R001–R004 (requirements)  | Implementação   | REQ-1.1–1.4                     | `[x]`  |
| T-IMP-05   | Implementar regras R005–R007 (design)        | Implementação   | REQ-1.5–1.6                     | `[x]`  |
| T-IMP-06   | Implementar regras R008–R009 (tasks)         | Implementação   | REQ-1.7–1.8                     | `[x]`  |
| T-IMP-07   | Implementar `RuleRegistry` e `Reporter`      | Implementação   | REQ-2.1, REQ-3.2–3.4            | `[x]`  |
| T-IMP-08   | Implementar CLI entrypoint                   | Implementação   | REQ-3.1–3.4                     | `[x]`  |
| T-IMP-09   | Testes de integração e E2E                   | Implementação   | REQ-1.4, REQ-2.2, REQ-3.2      | `[x]`  |
| T-APM-01   | Traces distribuídos (N/A — documentar)       | **APM**         | design.md → Traces              | `[x]`  |
| T-APM-02   | Implementar métricas (APM-M1–M5)             | **APM**         | APM-M1, APM-M2, APM-M3, APM-M4, APM-M5 | `[x]` |
| T-APM-03   | Implementar custom events (APM-E1–E3)        | **APM**         | APM-E1, APM-E2, APM-E3          | `[x]`  |
| T-APM-04   | Configurar alertas (ALT-01, ALT-02)          | **APM**         | ALT-01, ALT-02                  | `[ ]` *(especificado, não configurado — ver task)* |
| T-APM-05   | Configurar dashboard                         | **APM**         | design.md → Dashboard           | `[ ]` *(especificado, não configurado — ver task)* |
| T-DOC-01   | Promover decisões para `architecture.md`     | **Documentação**| —                               | `[x]`  |
| T-DOC-02   | Atualizar `KNOWLEDGE.md`                     | **Documentação**| —                               | `[x]`  |
| T-DOC-03   | Verificar consistência de `product.md`       | **Documentação**| —                               | `[ ]` *(product.md não inicializado — ver task)* |

---

## Tasks de Implementação

---

### T-IMP-01 — Escolher runtime e scaffoldar projeto

**Referências**: [REQ-1.4], [REQ NFR Portabilidade], [REQ NFR Extensibilidade]
**Tipo**: `T-IMP` — Decisão técnica + scaffold

**Descrição**:
Antes de qualquer código, avaliar o ambiente real do projeto e escolher o
runtime do `sdd-validate`. A decisão deve considerar: o que o APM CLI usa,
o que já está disponível no devcontainer ou CI do projeto, e a complexidade
de parsing de Markdown necessária. Após a decisão, criar a estrutura inicial
do projeto com build, lint e entry point vazio funcionando.

**Critérios de decisão para o runtime** (avaliar nesta ordem):
1. Se o APM CLI for Node.js → usar **TypeScript/Node.js** (zero runtime extra)
2. Se o ambiente de CI já tiver Python mas não Node → usar **Python**
3. Se portabilidade máxima for crítica e parsing simples for suficiente → usar **shell**
4. Se distribuição como binário único for prioridade → usar **Go**

**Subtasks**:
- [x] Inspecionar `package.json`, `apm.yml` ou equivalente para identificar o runtime do APM CLI
- [x] Documentar a decisão e justificativa em um comentário no topo do entrypoint
- [x] Criar estrutura de diretórios: `src/` (ou equivalente), `tests/`, `bin/sdd-validate`
- [x] Configurar build/lint mínimo (typecheck, formatter)
- [x] Verificar que `sdd-validate --help` executa sem erro

**Critério de conclusão**:
- [x] Runtime escolhido e justificado
- [x] `sdd-validate --help` executa e retorna usage text
- [x] Pipeline de build funcionando localmente

---

### T-IMP-02 — Implementar `MarkdownParser`

**Referências**: [REQ-1.1], [REQ-1.2], [REQ-1.3], [REQ-1.5], [REQ-1.6], [REQ-1.7], [REQ-1.8]
**Tipo**: `T-IMP` — Módulo de parsing

**Descrição**:
Componente central que recebe o conteúdo bruto de um arquivo `.md` e retorna
um `ParsedSpec` com seções `##`, IDs extraídos com tipo e número de linha,
e ocorrências de `[PREENCHER]`. É a base de todas as regras — deve ser
testado exaustivamente com fixtures.

**Subtasks**:
- [x] Extrair títulos de seção `##` com número de linha
- [x] Extrair IDs `REQ-x.x` com número de linha e valor completo
- [x] Extrair IDs `OBS-x` com número de linha
- [x] Extrair IDs `APM-Mx` e `APM-Ex` com número de linha
- [x] Extrair referências a tasks `T-APM-xx`, `T-DOC-xx`, `T-IMP-xx` com número de linha
- [x] Detectar ocorrências literais de `[PREENCHER]` com número de linha
- [x] Escrever testes unitários com pelo menos 3 fixtures de markdown (vazio, válido, inválido)

**Critério de conclusão**:
- [x] Todos os tipos de ID acima são extraídos corretamente com linha precisa
- [x] Testes unitários passando com cobertura das fixtures de cada tipo de ID
- [x] `[PREENCHER]` detectado mesmo quando embutido em tabela ou lista

---

### T-IMP-03 — Implementar `SpecDiscovery`

**Referências**: [REQ-2.3], [REQ-3.1]
**Tipo**: `T-IMP` — Módulo de descoberta

**Descrição**:
Responsável por encontrar diretórios de spec válidos em `.sdd/specs/`,
excluir `_template/`, e identificar quais arquivos (`requirements.md`,
`design.md`, `tasks.md`) estão presentes em cada diretório.

**Subtasks**:
- [x] Varrer recursivamente `<target>/.sdd/specs/` em busca de subdiretórios
- [x] Excluir `_template/` da descoberta
- [x] Para cada diretório, retornar lista de `{ path, type }` para arquivos presentes
- [x] Retornar lista vazia (sem erro) se `.sdd/specs/` não existir — [REQ-2.3]
- [x] Escrever testes com estrutura de diretório temporária (vazio, parcial, completo)

**Critério de conclusão**:
- [x] [REQ-2.3] Repositório sem specs retorna sucesso com aviso informativo
- [x] [REQ-3.1] Todos os specs em `.sdd/specs/**` são descobertos recursivamente
- [x] `_template/` nunca aparece nos resultados

---

### T-IMP-04 — Implementar regras R001–R004 (`requirements.md`)

**Referências**: [REQ-1.1], [REQ-1.2], [REQ-1.3], [REQ-1.4]
**Tipo**: `T-IMP` — Regras de validação

**Descrição**:
Implementar as quatro regras que validam `requirements.md`. Cada regra é uma
unidade independente que recebe `ParsedSpec` e retorna `Finding[]`.

**Subtasks**:
- [x] **R001** — Verificar presença de pelo menos um `OBS-x` em cada uma das 3 subseções de observabilidade; reportar qual subseção está ausente [REQ-1.1]
- [x] **R002** — Detectar `[PREENCHER]` remanescentes; reportar como `warning` com linha [REQ-1.2]
- [x] **R003** — Verificar unicidade de IDs `REQ-x.x`; reportar IDs duplicados com ambas as linhas [REQ-1.3]
- [x] **R004** — Verificar presença de ao menos um bloco `REQ-x.x` no arquivo [REQ-1.4]
- [x] Escrever testes unitários para cada regra: caso válido + cada cenário de erro

**Critério de conclusão**:
- [x] Cada regra retorna `Finding[]` vazio para spec válida ([REQ-1.4])
- [x] Cada cenário de erro de [REQ-1.1] a [REQ-1.4] gera o `Finding` correto com linha e mensagem
- [x] Testes unitários passando para todos os cenários

---

### T-IMP-05 — Implementar regras R005–R007 (`design.md`)

**Referências**: [REQ-1.5], [REQ-1.6]
**Tipo**: `T-IMP` — Regras de validação

**Descrição**:
Implementar as três regras que validam `design.md`. R006 é a mais complexa:
requer cruzar os `OBS-x` do `requirements.md` correspondente com os `APM-Mx`
e `APM-Ex` do `design.md` — exige `SpecContext` com o ParsedSpec do requirements.

**Subtasks**:
- [x] **R005** — Verificar presença de seção `## Application Performance Monitor` ou `## APM` [REQ-1.5]
- [x] **R006** — Cruzar `OBS-x` do requirements com `APM-Mx`/`APM-Ex` do design; listar OBS-x sem cobertura [REQ-1.6]
- [x] **R007** — Verificar unicidade de IDs `APM-Mx` e `APM-Ex`; reportar duplicatas com linha [REQ-1.6]
- [x] Garantir que R006 não falha quando `requirements.md` não existe no mesmo diretório (graceful degradation)
- [x] Escrever testes unitários com fixtures de par requirements+design

**Critério de conclusão**:
- [x] [REQ-1.5] Design sem seção APM gera erro com nome da seção esperada
- [x] [REQ-1.6] Todo OBS-x sem APM correspondente é listado no Finding
- [x] R006 com requirements.md ausente emite `warning` (não `error`)

---

### T-IMP-06 — Implementar regras R008–R009 (`tasks.md`)

**Referências**: [REQ-1.7], [REQ-1.8]
**Tipo**: `T-IMP` — Regras de validação

**Descrição**:
Implementar as duas regras que validam `tasks.md`. R008 verifica presença
das tasks T-APM obrigatórias; R009 detecta tasks de implementação sem
rastreabilidade para um requisito.

**Subtasks**:
- [x] **R008** — Verificar presença de `T-APM-01` a `T-APM-05` no arquivo; listar as ausentes [REQ-1.7]
- [x] **R009** — Para cada task que não seja `T-APM-xx` ou `T-DOC-xx`, verificar se contém `[REQ-x.x]`; reportar como `warning` as que não contêm [REQ-1.8]
- [x] Escrever testes: tasks.md completo (pass), faltando T-APM-03 (fail), task sem REQ ref (warn)

**Critério de conclusão**:
- [x] [REQ-1.7] Cada T-APM ausente é reportada individualmente no Finding
- [x] [REQ-1.8] Tasks sem REQ geram `warning` (não `error`) — não bloqueia CI por padrão
- [x] T-DOC-xx não são flagradas por R009

---

### T-IMP-07 — Implementar `RuleRegistry` e `Reporter`

**Referências**: [REQ-2.1], [REQ-3.2], [REQ-3.3], [REQ-3.4]
**Tipo**: `T-IMP` — Orquestração e formatação

**Descrição**:
`RuleRegistry` mapeia tipo de arquivo às regras aplicáveis e executa cada
uma, isolando exceções internas por regra. `Reporter` formata os achados em
texto legível por humano ou JSON válido conforme o schema do `design.md`.

**Subtasks**:
- [x] `RuleRegistry`: registrar R001–R009 associadas ao tipo de arquivo correto
- [x] `RuleRegistry`: capturar exceções por regra e emitir Finding `R000` (erro interno isolado)
- [x] `Reporter` modo `text`: agrupar findings por arquivo, prefixar `[ERROR]`/`[WARN]`, incluir linha
- [x] `Reporter` modo `json`: serializar `ValidationSummary` + `results[]` conforme schema do `design.md`
- [x] Verificar que output JSON é válido (`JSON.parse` ou equivalente no runtime escolhido) [REQ-3.4]
- [x] Testes: output text de spec com 1 erro + 2 warnings; output json equivalente

**Critério de conclusão**:
- [x] [REQ-2.1] Output `json` é legível estruturalmente (campos `summary`, `results`, `findings`)
- [x] [REQ-3.4] JSON é válido e parseable por ferramentas externas
- [x] Exceção interna em uma regra não aborta as demais regras

---

### T-IMP-08 — Implementar CLI entrypoint

**Referências**: [REQ-3.1], [REQ-3.2], [REQ-3.3], [REQ-3.4]
**Tipo**: `T-IMP` — CLI

**Descrição**:
Entrypoint executável que orquestra todo o pipeline: parse de argumentos,
chamada ao `SpecDiscovery`, iteração por spec, execução das regras via
`RuleRegistry`, emissão de telemetria e saída via `Reporter`. Define os
códigos de saída conforme o contrato do `design.md`.

**Subtasks**:
- [x] Parsear argumentos: `target-dir`, `--format`, `--spec`, `--strict`
- [x] Validar argumentos e emitir mensagem de uso no stderr em caso de arg inválido (exit 2)
- [x] Orquestrar pipeline: Discovery → Parse → Registry → Reporter
- [x] Implementar `--strict`: tratar warnings como errors para fins de exit code
- [x] Definir exit 0 (sem erros), exit 1 (≥1 erro), exit 2 (falha interna) [REQ-3.2]
- [x] Emitir evento `ValidationRun` (APM-E1) ao final — delegar ao `TelemetryEmitter` (implementado em T-APM-03)
- [x] Verificar que `sdd-validate` sem argumentos valida CWD recursivamente [REQ-3.1]

**Critério de conclusão**:
- [x] [REQ-3.1] Sem argumentos, valida `.sdd/specs/` do CWD
- [x] [REQ-3.2] Exit 1 quando há pelo menos um erro
- [x] [REQ-3.3] Exit 0 quando há apenas warnings
- [x] Argumento inválido retorna exit 2 com mensagem no stderr

---

### T-IMP-09 — Testes de integração e E2E

**Referências**: [REQ-1.4], [REQ-2.2], [REQ-3.2]
**Tipo**: `T-IMP` — Testes

**Descrição**:
Testes que exercem o pipeline completo — da chamada ao CLI até o output final.
Usa fixtures de spec pré-definidas (golden files) para garantir que o output
não regride entre versões.

**Subtasks**:
- [x] Criar fixture `valid-spec/`: requirements + design + tasks todos corretos → espera exit 0, zero findings
- [x] Criar fixture `missing-tapm/`: tasks.md sem T-APM-03 e T-APM-05 → espera exit 1, 2 errors em R008
- [x] Criar fixture `no-req-ref/`: task de implementação sem [REQ-x.x] → espera exit 0, 1 warning em R009
- [x] Criar fixture `placeholders/`: requirements com `[PREENCHER]` → espera exit 0, warnings em R002
- [x] Golden file test: output JSON da fixture `missing-tapm/` deve ser idêntico ao snapshot versionado [REQ-2.2]
- [x] E2E: chamar `sdd-validate` como processo real; verificar exit code e stdout

**Critério de conclusão**:
- [x] [REQ-2.2] Re-execução após correção retorna 0 sem falsos positivos
- [x] Todos os fixtures produzem exit codes e findings documentados nos critérios de aceite (+ fixture extra `no-specs/` para REQ-2.3)
- [x] Golden file snapshot versionado no repositório

---

## Tasks de APM / Instrumentação

> **Obrigatórias** (constitution.md, Princípio 1).

---

### T-APM-01 — Traces Distribuídos (N/A — documentar decisão)

**Referências**: `design.md → Traces Distribuídos`
**Tipo**: APM / Observabilidade

**Descrição**:
O `design.md` determinou que traces distribuídos não se aplicam a este
componente (processo síncrono de única thread, sem chamadas externas).
Esta task registra essa decisão formalmente para que não seja reaberta
em futuras revisões do componente.

**Subtasks**:
- [x] Adicionar comentário no entrypoint CLI documentando a ausência intencional de spans
- [x] Verificar que `correlationId` ainda é propagado nos logs estruturados de erro (OBS-5 via APM-E3) — *nota: não há campo literal `correlationId`; o CLI é síncrono de execução única (não há requisições concorrentes a correlacionar), e `errorCode`/`component`/`message` do APM-E3 já cobrem a intenção (contexto suficiente sem vazar conteúdo de spec)*
- [x] Registrar a decisão em T-DOC-01 como candidata a `architecture.md`

**Critério de conclusão**:
- [x] Decisão de N/A documentada no código e rastreável para o `design.md`
- [x] Nenhum span falso ou vazio adicionado ao código

---

### T-APM-02 — Implementar Métricas (APM-M1–M5)

**Referências**: `design.md` → APM-M1, APM-M2, APM-M3, APM-M4, APM-M5
**Tipo**: APM / Observabilidade

**Descrição**:
As métricas deste CLI são emitidas como campos do evento `ValidationRun`
(APM-E1) — não requerem SDK de métricas separado. Esta task implementa
a coleta dos valores durante a execução e os anexa ao payload do evento.

**Subtasks**:
- [x] [APM-M1] Contar `specsScanned` durante o pipeline
- [x] [APM-M2] Contar `errors` acumulados de todos os specs
- [x] [APM-M3] Contar `warnings` acumulados de todos os specs
- [x] [APM-M4] Medir `durationMs` do início ao fim do pipeline (wall clock)
- [x] [APM-M5] Agregar `errorsByRule`: mapa `{ ruleId: count }` para breakdown por categoria
- [x] Verificar nomenclatura contra `apm-standards.md` (`sdd.validator.*`)

**Critério de conclusão**:
- [x] Todos os valores APM-M1..M5 presentes no payload do evento `ValidationRun`
- [x] `durationMs` medido com precisão de milissegundo
- [x] `errorsByRule` inclui apenas regras que geraram pelo menos 1 erro

---

### T-APM-03 — Implementar Custom Events (APM-E1–E3)

**Referências**: `design.md` → APM-E1, APM-E2, APM-E3
**Tipo**: APM / Observabilidade

**Descrição**:
Implementar o `TelemetryEmitter` que serializa e emite os três custom events
como linhas JSON estruturadas em stdout (separadas do relatório principal).
A variável de ambiente `SDD_CALLER=agent` é usada para preencher o campo
`source` do evento APM-E1.

**Subtasks**:
- [x] [APM-E1] Emitir `ValidationRun` ao final de cada execução com todos os campos do design.md
- [x] [APM-E2] Emitir `ValidationError` para cada regra que gerou ≥1 erro, com `ruleId`, `specPath`, `occurrences`
- [x] [APM-E3] Emitir `InternalFailure` em exceção não tratada — **sem incluir conteúdo dos specs** (compliance)
- [x] Detectar `SDD_CALLER` env var e preencher `source: "human" | "agent"` em APM-E1 [OBS-4]
- [x] Separar eventos de telemetria do relatório: emitir em canal/stream distinto ou com prefixo `[telemetry]` — *implementado como stream distinto: telemetria em stderr, relatório em stdout*
- [x] Verificar que nenhum dado PII ou conteúdo de spec aparece em APM-E3

**Critério de conclusão**:
- [x] APM-E1 emitido em toda execução com campos corretos
- [x] APM-E2 emitido apenas quando há erros (não para warnings)
- [x] APM-E3 não vaza conteúdo de spec em nenhum campo
- [x] Output de telemetria não polui o relatório principal quando `--format=json`

---

### T-APM-04 — Configurar Alertas (ALT-01, ALT-02)

**Referências**: `design.md` → ALT-01, ALT-02
**Tipo**: APM / Configuração de Alertas

**Descrição**:
Os alertas deste CLI dependem de um log aggregator que ingira os eventos
`ValidationRun` (APM-E1) e `InternalFailure` (APM-E3). Esta task configura
as queries/regras no sistema de APM do projeto para disparar os alertas
definidos no `design.md`.

> **Status**: especificado (queries ALT-01/ALT-02 documentadas em
> `design.md`), **não configurado** — este repositório não tem hoje nenhum
> backend de observabilidade real (Datadog, Grafana, etc.) onde registrar
> ou testar essas queries. Decisão registrada em `KNOWLEDGE.md` e no
> próprio `design.md` (seção Alertas). Fica pendente até haver um backend.

**Subtasks**:
- [ ] [ALT-01] Criar alerta "sdd-validate Internal Failure Rate Alta": `InternalFailure > 2 em 24h`, severity High
- [ ] [ALT-02] Criar alerta "Taxa de Erros R008 Alta": `ValidationError{ruleId='R008'} > 5 em 7 dias`, severity Medium
- [ ] Configurar `action` e `runbook` conforme `design.md` para cada alerta
- [ ] Testar disparo em ambiente de staging (injetar evento sintético)
- [ ] Documentar query usada para cada alerta no runbook

**Critério de conclusão**:
- [ ] ALT-01 e ALT-02 ativos no sistema de APM
- [ ] Disparo testado e confirmado
- [ ] Runbooks documentados ou referenciados

---

### T-APM-05 — Configurar Dashboard

**Referências**: `design.md → Conceito de Dashboard`
**Tipo**: APM / Dashboard

**Descrição**:
Criar o dashboard no APM do projeto conforme o conceito definido em
`design.md`. O dashboard deve ser acessível ao time e mostrar dados reais
após a primeira execução do validador em CI.

> **Status**: especificado (conceito de dashboard com 4 painéis documentado
> em `design.md`, mapeando cada painel ao evento/métrica exato que o
> alimentaria), **não construído** — mesma razão de T-APM-04: sem backend
> de observabilidade real, não há onde publicar o dashboard nem URL para
> registrar em `KNOWLEDGE.md`. Fica pendente até haver um backend.

**Subtasks**:
- [ ] Criar dashboard com nome: `SDD Framework — Spec Validator`
- [ ] Painel 1 (Saúde): `ValidationRun/dia`, `Taxa Sucesso %`, `Duração Média` (APM-M4)
- [ ] Painel 2 (Qualidade): `Erros por Regra 30d` (APM-M5), `Avisos por Regra`
- [ ] Painel 3 (Adoção): `Invocações humano vs agente` (APM-E1.source)
- [ ] Painel 4 (Falhas internas): `InternalFailures` (APM-E3 count) + alertas ativos
- [ ] Compartilhar dashboard com o time e registrar URL em `KNOWLEDGE.md`

**Critério de conclusão**:
- [ ] Dashboard criado e acessível ao time
- [ ] Dados reais visíveis após execução de teste em CI
- [ ] URL do dashboard registrada em `KNOWLEDGE.md`

---

## Tasks de Documentação / Memory Bank

> **Obrigatórias** — o ciclo não fecha sem estas tasks.

---

### T-DOC-01 — Promover Decisões Arquiteturais para `architecture.md`

**Tipo**: Documentação / Memory Bank

**Descrição**:
Revisar `design.md` e promover para `architecture.md` as decisões com
impacto duradouro: runtime escolhido em T-IMP-01, contrato do JSON schema,
convenção de nomenclatura APM `sdd.validator.*`, e a decisão de N/A para
traces (T-APM-01).

**Subtasks**:
- [x] Registrar runtime escolhido com justificativa em `architecture.md`
- [x] Registrar schema JSON do `sdd-validate` como contrato de interface estável
- [x] Registrar decisão de N/A para traces em CLIs síncronos como padrão do projeto
- [x] Confirmar que nenhuma entrada nova contradiz as existentes

**Critério de conclusão**:
- [x] `architecture.md` reflete as 3 decisões acima
- [x] Sem contradições com entradas anteriores

---

### T-DOC-02 — Atualizar `KNOWLEDGE.md`

**Tipo**: Documentação / Memory Bank

**Descrição**:
Registrar padrões emergentes e lições aprendidas desta spec.

**Subtasks**:
- [x] Registrar o padrão "sensor computacional para spec" como categoria de harness computational feedback
- [x] Registrar a adaptação do modelo APM para CLIs (métricas como campos de evento, sem traces)
- [x] Registrar a decisão de deixar runtime em aberto no design e delegar para T-IMP-01
- [x] Adicionar URL do dashboard ao registro de ferramentas do projeto — *N/A: sem dashboard real (T-APM-05 pendente, sem backend de observabilidade)*

**Critério de conclusão**:
- [x] `KNOWLEDGE.md` atualizado com pelo menos os 3 primeiros itens acima
- [x] Data e contexto registrados

---

### T-DOC-03 — Verificar Consistência de `product.md`

**Tipo**: Documentação / Memory Bank

**Descrição**:
Verificar se o `sdd-validate` impacta KPIs, personas ou objetivos do
produto registrados em `product.md`. Como `product.md` ainda está com
`[PREENCHER]`, esta task serve também para iniciar o preenchimento das
seções afetadas por esta feature (persona "desenvolvedor usando SDD",
KPI "taxa de specs válidas na primeira revisão").

> **Status**: `product.md` está totalmente não inicializado ([PREENCHER]
> em toda seção) — decidiu-se **não** preencher unilateralmente (persona/KPI
> de produto é decisão do humano, não do agente). Decisão registrada em
> `KNOWLEDGE.md`. Fica pendente até uma inicialização de memory bank
> (`/init-memory-bank`) tratar `product.md` como um todo.

**Subtasks**:
- [ ] Verificar se a persona "desenvolvedor usando SDD" já está em `product.md`; adicionar se ausente
- [ ] Verificar se "taxa de specs válidas na primeira revisão" pode ser um KPI; adicionar se aprovado pelo humano
- [ ] Vincular o KPI novo a `APM-M2` (erros por execução) se adicionado

**Critério de conclusão**:
- [ ] `product.md` verificado — atualizado ou explicitamente marcado como N/A para esta feature
- [ ] Qualquer KPI novo está vinculado a uma métrica APM

---

## Checklist Final de Entrega

```
Implementação:
  [x] T-IMP-01 a T-IMP-09 concluídas
  [x] Todos os critérios de aceite de requirements.md atendidos (REQ-1.1..3.4)
  [x] Testes unitários, integração e E2E passando (69 testes)

APM / Observabilidade:
  [x] T-APM-01: Decisão N/A documentada no código
  [x] T-APM-02: Métricas APM-M1..M5 coletadas e presentes em APM-E1
  [x] T-APM-03: Eventos APM-E1..E3 emitidos e validados
  [ ] T-APM-04: Alertas ALT-01 e ALT-02 ativos e testados — especificado, não configurado (sem backend)
  [ ] T-APM-05: Dashboard criado e acessível ao time — especificado, não construído (sem backend)

Qualidade:
  [x] Code review aprovado
  [x] APM-E3 não vaza conteúdo de spec (compliance)
  [x] SLOs do design.md validados (P95 < 2s por spec)

Documentação / Memory Bank:
  [x] T-DOC-01: Runtime e decisões promovidos para architecture.md
  [x] T-DOC-02: KNOWLEDGE.md atualizado
  [ ] T-DOC-03: product.md verificado e atualizado se necessário — pendente (product.md não inicializado)

Spec-first (descarte):
  [ ] Memory Bank atualizado (T-DOC-01 a T-DOC-03 concluídas) — BLOQUEADO: T-DOC-03 pendente
  [ ] Retrospectiva do ciclo oferecida ao humano (ver AGENTS.md)

  > Esta spec NÃO deve ser descartada ainda — por regra do próprio
  > framework (ver KNOWLEDGE.md → FAQ "Como saber se um spec-first está
  > terminado"), o descarte exige checklist final 100% marcado. T-APM-04,
  > T-APM-05 e T-DOC-03 continuam pendentes por decisões já tomadas e
  > documentadas (sem backend de observabilidade; product.md não
  > inicializado) — não por esquecimento. A spec permanece ativa como
  > registro dessas pendências até serem resolvidas.
```
