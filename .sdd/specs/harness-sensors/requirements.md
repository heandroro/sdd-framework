# Requirements — Harness Sensors (Spec Validation)

> **Spec-first**: Este documento é criado antes do código e descartado após
> a entrega. É a fonte de verdade funcional para humanos e agentes de IA.
>
> **Instrução para IA**: Não insira decisões técnicas aqui — isso pertence ao
> `design.md`. Ao finalizar, verifique o checklist no final.

---

## Contexto da Feature

O SDD framework atualmente é composto quase exclusivamente por guias
(feedforward, inferencial). O único sensor de feedback existente é o
`revisar-spec.prompt.md`, invocado manualmente e sob demanda. Isso significa que
erros estruturais em specs (tasks sem referência REQ-x.x, T-APM ausentes,
placeholders não preenchidos) só são detectados durante a revisão humana —
tarde e de forma inconstante.

Esta feature adiciona **sensores computacionais** ao framework: validação
automática e determinística dos artefatos de spec, executável tanto por humanos
quanto por agentes de IA como parte do loop de auto-correção.

---

## Histórias de Usuário

### História 1 — Validação de spec antes de avançar de etapa

**Como** desenvolvedor(a) usando o SDD,
**quero** poder validar a estrutura de um artefato de spec (`requirements.md`,
`design.md` ou `tasks.md`) com um único comando,
**para que** erros estruturais sejam detectados antes da revisão humana, sem
depender de checklist manual.

**Critérios de Aceite**

| ID       | Cenário (GIVEN / WHEN / THEN) |
|----------|-------------------------------|
| REQ-1.1  | **DADO** um `requirements.md` sem pelo menos um item `OBS-x` preenchido **QUANDO** o validador é executado **ENTÃO** reporta erro identificando a seção ausente |
| REQ-1.2  | **DADO** um `requirements.md` com placeholder `[PREENCHER]` em qualquer campo **QUANDO** o validador é executado **ENTÃO** reporta aviso com o campo e número de linha |
| REQ-1.3  | **DADO** um `requirements.md` com IDs de requisito duplicados (ex: dois `REQ-1.1`) **QUANDO** o validador é executado **ENTÃO** reporta erro listando os IDs duplicados |
| REQ-1.4  | **DADO** um `requirements.md` estruturalmente correto **QUANDO** o validador é executado **ENTÃO** retorna saída de sucesso e código de saída 0 |
| REQ-1.5  | **DADO** um `design.md` sem seção `## Application Performance Monitor` ou `## APM` **QUANDO** o validador é executado **ENTÃO** reporta erro indicando a seção obrigatória ausente |
| REQ-1.6  | **DADO** um `design.md` com itens `OBS-x` em `requirements.md` correspondente mas sem `APM-Mx` ou `APM-Ex` correspondentes **QUANDO** o validador é executado **ENTÃO** reporta erro listando os OBS-x sem cobertura APM |
| REQ-1.7  | **DADO** um `tasks.md` sem as tasks `T-APM-01` a `T-APM-05` **QUANDO** o validador é executado **ENTÃO** reporta erro listando as tasks T-APM ausentes |
| REQ-1.8  | **DADO** um `tasks.md` com qualquer task de implementação sem referência `[REQ-x.x]` **QUANDO** o validador é executado **ENTÃO** reporta aviso listando as tasks sem rastreabilidade |

---

### História 2 — Agente de IA usa o validador como sensor de auto-correção

**Como** agente de IA executando o ciclo SDD,
**quero** poder executar o validador após gerar ou editar um artefato de spec,
**para que** eu possa corrigir erros estruturais de forma autônoma antes de
apresentar o artefato ao humano.

**Critérios de Aceite**

| ID       | Cenário (GIVEN / WHEN / THEN) |
|----------|-------------------------------|
| REQ-2.1  | **DADO** que o agente acabou de gerar um `tasks.md` **QUANDO** executa o validador **ENTÃO** recebe saída estruturada (legível por LLM) com lista de erros e avisos por categoria |
| REQ-2.2  | **DADO** que o validador reportou erros **QUANDO** o agente corrige os problemas e re-executa **ENTÃO** o validador retorna sucesso sem falsos positivos |
| REQ-2.3  | **DADO** um repositório sem nenhum spec em `.sdd/specs/` **QUANDO** o validador é executado sem argumentos **ENTÃO** não reporta erro — retorna aviso informativo e código de saída 0 |

---

### História 3 — Integração no ciclo de entrega (shift-left)

**Como** time de engenharia,
**quero** que o validador possa ser executado em pipeline de CI ou como
pre-commit hook,
**para que** specs malformadas sejam bloqueadas antes de chegarem à revisão
humana ou serem mergeadas.

**Critérios de Aceite**

| ID       | Cenário (GIVEN / WHEN / THEN) |
|----------|-------------------------------|
| REQ-3.1  | **DADO** um repositório com specs **QUANDO** o validador é chamado sem argumentos **ENTÃO** valida todos os specs em `.sdd/specs/` recursivamente |
| REQ-3.2  | **DADO** que pelo menos um erro (não aviso) foi encontrado **QUANDO** o validador termina **ENTÃO** retorna código de saída não-zero, compatível com ferramentas de CI |
| REQ-3.3  | **DADO** que apenas avisos (sem erros) foram encontrados **QUANDO** o validador termina **ENTÃO** retorna código de saída 0 |
| REQ-3.4  | **DADO** que o validador é executado em modo `--format=json` **QUANDO** termina **ENTÃO** a saída é JSON válido com schema documentado, utilizável por outros processos |

---

## Requisitos de Observabilidade (Application Performance Monitor)

### O que precisa ser visível para o time de operações?

- [ ] **[OBS-1]** Deve ser possível saber quantos specs foram validados e qual a
  taxa de sucesso/falha por execução (métricas de uso do validador)
- [ ] **[OBS-2]** Deve ser possível identificar quais categorias de erro são mais
  frequentes (T-APM ausente, REQ sem rastreabilidade, placeholders, etc.)

### O que precisa ser visível para o time de produto/negócio?

- [ ] **[OBS-3]** Deve ser possível medir se a adoção do validador reduziu o
  número de specs rejeitadas na revisão humana ao longo do tempo
- [ ] **[OBS-4]** Deve ser possível saber com que frequência o validador é
  utilizado (humano vs. agente de IA)

### Quais falhas precisam gerar alertas imediatos?

- [ ] **[OBS-5]** Se o validador falhar com erro interno (exceção não tratada),
  deve logar contexto suficiente para diagnóstico sem expor conteúdo sensível
  dos specs

---

## Requisitos Não-Funcionais

| Categoria     | Requisito                                                              | Prioridade |
|---------------|------------------------------------------------------------------------|------------|
| Performance   | Validação de um spec individual deve completar em < 2 segundos         | Alta       |
| Usabilidade   | Mensagens de erro devem incluir nome do arquivo e número de linha      | Alta       |
| Portabilidade | Executável sem instalação de runtime adicional além do já exigido pelo framework | Alta |
| Extensibilidade | Novas regras de validação devem ser adicionáveis sem alterar o núcleo | Média      |

---

## O que está fora do escopo

- Validação semântica do conteúdo dos requisitos (ex: detectar requisitos ambíguos) — isso é tarefa inferencial, não computacional
- Correção automática dos erros (auto-fix) — o validador reporta, não corrige
- Validação de artefatos fora do ciclo SDD (ex: código-fonte, configs)
- Interface visual / dashboard de histórico de validações
- Integração com ferramentas de APM externas (Datadog, Grafana, etc.)

---

## Dependências e Pré-condições

- O framework SDD deve estar instalado no repositório (`AGENTS.md` presente, `.sdd/` estruturado)
- Os templates de spec (`_template/`) devem estar disponíveis como referência de estrutura esperada
- O runtime disponível no projeto deve ser identificado antes da etapa de design (decisão técnica)

---

## Checklist de Conformidade

```
[x] Requisitos são funcionais — sem detalhes de implementação técnica
[x] Toda história tem critérios de aceite no formato GIVEN/WHEN/THEN
[x] IDs de requisito são únicos e sequenciais (REQ-x.x)
[x] Seção de Observability Requirements preenchida (mínimo 1 item por subseção)
[x] IDs de observabilidade são únicos (OBS-x)
[x] Seção "Fora do escopo" preenchida
[ ] Alinhado com product.md (personas e KPIs de negócio) — product.md ainda está com [PREENCHER]; alinhamento pendente de inicialização do memory bank
```
