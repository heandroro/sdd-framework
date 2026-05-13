# Tasks — [Nome da Feature]

> **Pré-condição**: `design.md` deve estar aprovado por um humano antes de
> gerar este documento.
>
> **Instrução para IA**: Gere as tasks com base em `requirements.md` e
> `design.md`. Cada task deve:
> - Ser pequena o suficiente para uma sessão de trabalho
> - Referenciar pelo menos um REQ-x.x
> - As tasks de Application Performance Monitor devem referenciar itens APM-Mx / APM-Ex do design.md
>
> **Instrução de execução**: Execute uma task por vez. Após completar cada
> task, marque-a com `[x]` e aguarde revisão humana antes de prosseguir.

---

## Resumo de Tasks

> Visão geral do trabalho planejado.

**Prefixos de ID:**

| Prefixo | Tipo | Quando usar |
|---------|------|-------------|
| `T-IMP` | Implementação | Lógica de negócio, endpoints, modelos de dados, testes |
| `T-INT` | Integração | Conexões com sistemas externos, adapters, clients |
| `T-MIG` | Migração | Migrations de banco, scripts de transformação de dados |
| `T-CFG` | Configuração | Infra, variáveis de ambiente, feature flags, CI/CD |
| `T-APM` | Application Performance Monitor / Observabilidade | **Obrigatório** — instrumentação, alertas, dashboard |

| ID | Task | Tipo | Refs | Status |
|----|------|------|------|--------|
| T-IMP-01 | [Nome da task] | Implementação | [REQ-x.x] | `[ ]` |
| T-IMP-02 | [Nome da task] | Implementação | [REQ-x.x] | `[ ]` |
| T-APM-01 | Traces distribuídos | **Application Performance Monitor** | [APM-Mx] | `[ ]` |
| T-APM-02 | Métricas customizadas | **Application Performance Monitor** | [APM-Mx] | `[ ]` |
| T-APM-03 | Custom events | **Application Performance Monitor** | [APM-Ex] | `[ ]` |
| T-APM-04 | Alertas | **Application Performance Monitor** | [ALT-xx] | `[ ]` |
| T-APM-05 | Dashboard | **Application Performance Monitor** | — | `[ ]` |

---

## Tasks de Implementação

---

### T-IMP-01 — [Nome da task]

**Referências**: [REQ-1.1], [REQ-1.2]
**Tipo**: `T-IMP` — Implementação / Modelo de dados / API / Teste

**Descrição**:
> O que esta task constrói. Seja específico sobre o comportamento esperado
> ao final da task.

**Subtasks**:
- [ ] [Subtask 1 — ex: criar o modelo de dados da entidade X]
- [ ] [Subtask 2 — ex: implementar o endpoint POST /api/x]
- [ ] [Subtask 3 — ex: adicionar validações conforme REQ-1.1]
- [ ] [Subtask 4 — ex: escrever testes unitários para a lógica de Y]

**Critério de conclusão**:
- [ ] [REQ-1.1] Critério de aceite atendido
- [ ] [REQ-1.2] Critério de aceite atendido
- [ ] Testes passando
- [ ] Code review aprovado

---

### T-IMP-02 — [Nome da task]

**Referências**: [REQ-2.1]
**Tipo**: `T-IMP` — [ex: Implementação / Integração / Migração / Configuração]

**Descrição**:
> [Descrição da task]

**Subtasks**:
- [ ] [Subtask 1]
- [ ] [Subtask 2]

**Critério de conclusão**:
- [ ] [REQ-2.1] Critério de aceite atendido
- [ ] Testes passando

---

## Tasks de Application Performance Monitor / Instrumentação

> **Estas tasks são obrigatórias** (constitution.md, Princípio 1).
> Devem ser executadas para que a feature seja considerada completa.

---

### T-APM-01 — Implementar Traces Distribuídos

**Referências**: `design.md → Traces Distribuídos`
**Tipo**: Application Performance Monitor / Observabilidade

**Descrição**:
> Instrumentar os spans definidos na seção "Traces Distribuídos" do `design.md`
> para rastreamento fim-a-fim.

**Subtasks**:
- [ ] Configurar propagação de Trace Context (W3C) na entrada
- [ ] Adicionar span para cada operação listada na tabela de Traces do design.md
- [ ] Garantir que `correlationId` é propagado em todos os logs desta feature
- [ ] Verificar que traces aparecem corretamente no Application Performance Monitor

**Critério de conclusão**:
- [ ] Todos os spans da tabela de Traces estão implementados
- [ ] Trace end-to-end visível no Application Performance Monitor para um request completo

---

### T-APM-02 — Implementar Métricas Customizadas

**Referências**: `design.md → Métricas Customizadas` (APM-M1, APM-M2, APM-M3...)
**Tipo**: Application Performance Monitor / Observabilidade

**Descrição**:
> Instrumentar as métricas customizadas definidas em `design.md`.

**Subtasks**:
- [ ] [APM-M1] Implementar métrica `[nome]` (Counter)
- [ ] [APM-M2] Implementar métrica `[nome]` (Histogram)
- [ ] [APM-M3] Implementar métrica `[nome]` (Gauge)
- [ ] Verificar nomenclatura conforme `apm-standards.md`
- [ ] Validar que métricas aparecem no Application Performance Monitor

**Critério de conclusão**:
- [ ] Todas as métricas APM-Mx implementadas
- [ ] Nomenclatura validada contra `apm-standards.md`
- [ ] Métricas visíveis e corretamente tipadas no Application Performance Monitor

---

### T-APM-03 — Implementar Custom Events (Eventos de Negócio)

**Referências**: `design.md → Custom Events` (APM-E1, APM-E2...)
**Tipo**: Application Performance Monitor / Observabilidade

**Descrição**:
> Instrumentar os custom events de negócio definidos em `design.md`.

**Subtasks**:
- [ ] [APM-E1] Implementar evento `[NomeDoEvento]` com propriedades corretas
- [ ] [APM-E2] Implementar evento `[NomeDoEvento]` com propriedades corretas
- [ ] Verificar que nenhum dado PII/sensível é incluído (compliance)
- [ ] Validar que eventos aparecem no Application Performance Monitor

**Critério de conclusão**:
- [ ] Todos os eventos APM-Ex implementados
- [ ] Nenhum dado sensível nos payloads (revisão de compliance)
- [ ] Eventos visíveis no Application Performance Monitor com propriedades corretas

---

### T-APM-04 — Configurar Alertas

**Referências**: `design.md → Alertas` (ALT-01, ALT-02...)
**Tipo**: Application Performance Monitor / Configuração de Alertas

**Descrição**:
> Criar/configurar as regras de alerta definidas em `design.md` na plataforma Application Performance Monitor.

**Subtasks**:
- [ ] [ALT-01] Criar alerta `[nome]` com condição, severidade e ação corretos
- [ ] [ALT-02] Criar alerta `[nome]`
- [ ] Testar disparo dos alertas em ambiente de staging
- [ ] Documentar runbooks referenciados nos alertas

**Critério de conclusão**:
- [ ] Todos os alertas ALT-xx criados e ativos
- [ ] Alertas testados (verificar disparo e resolução)
- [ ] Runbooks documentados ou referenciados

---

### T-APM-05 — Configurar Dashboard

**Referências**: `design.md → Conceito de Dashboard`
**Tipo**: Application Performance Monitor / Dashboard

**Descrição**:
> Criar o dashboard no Application Performance Monitor conforme o conceito definido em `design.md`.

**Subtasks**:
- [ ] Criar dashboard com nome padronizado: `[Produto] — [Nome da Feature]`
- [ ] Adicionar seção Saúde (disponibilidade, taxa de erro, P95)
- [ ] Adicionar seção Volume (métricas APM-Mx relevantes)
- [ ] Adicionar seção Negócio (custom events APM-Ex)
- [ ] Adicionar painel de alertas ativos
- [ ] Compartilhar dashboard com o time

**Critério de conclusão**:
- [ ] Dashboard criado e acessível ao time
- [ ] Todas as seções do conceito de dashboard implementadas
- [ ] Dados reais visíveis (validar com request de teste em staging)

---

## Checklist Final de Entrega

> Execute este checklist antes de considerar a feature completa.

```
Implementação:
  [ ] Todas as tasks T-IMP-xx, T-INT-xx, T-MIG-xx, T-CFG-xx concluídas
  [ ] Todos os critérios de aceite de requirements.md atendidos
  [ ] Testes (unitários, integração) passando no CI/CD

Application Performance Monitor / Observabilidade:
  [ ] T-APM-01: Traces distribuídos implementados e visíveis
  [ ] T-APM-02: Métricas customizadas implementadas e visíveis
  [ ] T-APM-03: Custom events implementados e visíveis
  [ ] T-APM-04: Alertas configurados e testados
  [ ] T-APM-05: Dashboard criado e acessível

Qualidade:
  [ ] Code review aprovado
  [ ] Sem dados PII/sensíveis na telemetria
  [ ] SLOs de design.md validados em staging

Spec-first (descarte):
  [ ] Após entrega, este spec pode ser arquivado ou descartado
  [ ] Qualquer informação arquitetural relevante foi promovida para architecture.md
```
