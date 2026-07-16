# JIT Spec — Alternativa Leve ao Ciclo SDD Completo

> O JIT Spec **não é uma etapa do ciclo SDD completo** — é um caminho
> alternativo e mutuamente exclusivo. Uma mudança segue o ciclo completo
> (`requirements.md` → `design.md` → `tasks.md`) OU o JIT Spec OU vai direto
> ao código (mudança trivial) — nunca mais de um desses ao mesmo tempo.
> Para o ciclo completo, veja [README.md](../README.md).

---

## O que é

Para mudanças pequenas, o ciclo completo é overhead — mas "direto ao código"
descarta a disciplina de especificação. O **JIT Spec (Just-in-Time
Specification)** resolve isso sem recorrer ao ciclo completo: um contrato
efêmero de **artefato único**, derivado do memory bank, com **um único gate
humano**.

## Elegibilidade

Todos os critérios devem valer (defaults ajustáveis por projeto):

```
 ┌──────────────────┐
 │  ELEGIBILIDADE   │  → 1 componente · ≤2 arquivos de produção estimados ·
 │                  │    sem decisão arquitetural nova · sem telemetria nova
 └────────┬─────────┘    (qualquer critério violado? → ciclo completo)
          ▼
 ┌──────────────────┐
 │  JIT SPEC        │  → Artefato único (≤ ~20 linhas) derivado do memory bank:
 │                  │    intenção · critérios de aceite · componentes tocados ·
 └────────┬─────────┘    verificação da telemetria APM existente
          │  Gate único: aprovação humana do contrato inteiro
          ▼
 ┌──────────────────┐
 │  IMPLEMENTAÇÃO   │  → Execução direta; revisão no diff final
 │                  │    Estourou a elegibilidade durante a execução?
 └────────┬─────────┘    → parar e promover para spec completa (escalada)
          ▼
 ┌──────────────────┐
 │  DESCARTE        │  → CHANGELOG obrigatório · ADR se mudou decisão
 │                  │    arquitetural · artefato JIT descartado (spec-first)
 └──────────────────┘
```

Violou qualquer critério **antes** da aprovação → recomende o ciclo
completo. Mudança trivial (typo, cosmético) → abaixo do JIT: direto ao
código, sem spec.

## Regras do artefato

Anti-formalismo é requisito, não estilo:

- Um único bloco de ~20 linhas: inline na sessão do agente ou em
  `.sdd/jit/<nome>.md` — pasta separada de `.sdd/specs/`, que é reservada
  para o ciclo completo (`requirements.md` + `design.md` + `tasks.md`); o
  JIT Spec não tem essa forma
- **Sem** IDs `REQ-x`, tabelas GIVEN/WHEN/THEN, seções `OBS-x` ou checklists
  — se o formato do ciclo completo aparecer no artefato, o fluxo degenerou
  em "SDD em miniatura"
- **Derivado do memory bank**: o agente não pergunta ao humano o que o
  projeto já sabe
- A telemetria **existente** deve cobrir o cenário — telemetria nova exige
  o ciclo completo

## Exemplo de artefato JIT preenchido

```markdown
## JIT Spec — corrigir timeout no retry de pagamento

**Intenção**: aumentar o timeout do client de pagamento de 2s para 5s,
que está causando falsos negativos no retry.

**Aceite**: pedidos com resposta entre 2–5s completam sem acionar retry;
testes de integração do módulo payment continuam verdes.

**Toca**: `payment/client.ts` (1 componente, 1 arquivo).

**Telemetria**: coberto pelo trace existente `payment.charge` e pela
métrica `payment.retry.count` — nada novo necessário.

Elegível: ✅ 1 componente · ≤2 arquivos · sem decisão arquitetural · sem telemetria nova
```

## SDD completo vs JIT Spec

Resumo lado a lado dos dois contratos formais que o framework oferece:

| Dimensão | Ciclo SDD completo | JIT Spec |
|---|---|---|
| Nº de gates humanos | 3 — requirements → design → tasks | 1 — contrato inteiro, de uma vez |
| Artefatos | `requirements.md` + `design.md` + `tasks.md` (+ `agent-context.md` opcional) | 1 arquivo único, ≤ ~20 linhas |
| Formalismo | IDs `REQ-x`, tabelas GIVEN/WHEN/THEN, `OBS-x`, checklists | Anti-formalismo é requisito — nada disso pode aparecer |
| Execução | Task a task, com revisão incremental | Direta; revisão só no diff final |
| Telemetria | Pode introduzir telemetria nova (`APM-Mx`/`APM-Ex`) | Só usa telemetria **existente** — nova telemetria escala para o ciclo completo |
| Descarte | Spec descartada após o merge; decisões duráveis vão para o memory bank | Artefato JIT descartado após o merge; `CHANGELOG.md` obrigatório |
| Quando usar | Feature média (3–8 pontos), decisão arquitetural nova, telemetria nova | 1 componente, ≤2 arquivos, sem decisão arquitetural nova, sem telemetria nova |

## Onde vive

- Artefato: `.sdd/jit/<nome>.md` (efêmero, descartado após o merge)
- Especificação formal deste fluxo (enquanto ativa): `.sdd/specs/jit-spec/`
- Fluxo operacional que o agente segue: [AGENTS.md](../AGENTS.md) → Workflow JIT Spec
