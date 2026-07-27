---
name: sdd-workflow
description: Use when the user is working on files inside .sdd/ or mentions spec, requirements, design, tasks, memory bank, or APM in a spec-driven development context. Provides the complete SDD workflow (contracts), guardrail pointers (Harness), the agent's self-correction loop (Loop), and escalation rules (Handoff) — plus the lighter JIT Spec alternative and the sdd-validate computational sensor.
---

# SDD Workflow

## Quando consultar este guia

Consulte quando o usuário estiver:
- Criando ou editando arquivos em `.sdd/specs/` ou `.sdd/memory-bank/`
- Perguntando sobre o ciclo SDD (requirements, design, tasks)
- Executando tasks de um `tasks.md`
- Promovendo decisões para `architecture.md` ou `adr/`
- Usando os comandos `/criar-spec`, `/revisar-spec`, `/gerar-tasks`, `/promover-adr`, `/validar-spec`
- Repetindo uma correção sem sucesso (LOOP) ou decidindo se precisa parar e pedir decisão humana (HANDOFF)

## Os 4 quadrantes desta skill

- **SDD** — contratos e funções do ciclo requirements→design→tasks (e a
  alternativa JIT Spec). Conteúdo principal deste arquivo, abaixo.
- **HARNESS** — guardrails e traços de auditoria. Ver "Harness (guardrails)"
  mais abaixo.
- **LOOP** — o ciclo interno de auto-correção do agente (ação → observação
  → ajuste), com limite determinístico. LOAD references/loop.md.
- **HANDOFF** — quando e como transferir o controle (hoje: só para o
  humano). LOAD references/handoff.md.

## Tamanho ideal de problema

| Tamanho | Recomendação |
|---|---|
| Mudança trivial (typo, cosmético) | Sem spec — direto ao código |
| Mudança pequena | **JIT Spec** — artefato único, 1 gate humano (ver abaixo) |
| Feature média (3–8 pontos) | **Use o fluxo completo** |
| Feature grande | Quebre em sub-specs antes de iniciar |
| Produto novo | Comece pelo memory bank; uma spec por feature |

## Fluxo JIT Spec (mudanças pequenas)

> Alternativa ao ciclo completo descrito abaixo — não uma etapa dele.

Contrato efêmero de **artefato único** (≤ ~20 linhas), derivado do memory bank,
com **um único gate humano**. Elegibilidade: 1 componente, ≤2 arquivos de
produção estimados, sem decisão arquitetural nova, sem telemetria nova.

Regras:
- O artefato contém: intenção (1–2 frases), critérios de aceite, componentes tocados, verificação da telemetria APM existente
- **Anti-formalismo é requisito**: sem IDs REQ-x, sem tabelas GIVEN/WHEN/THEN, sem OBS-x, sem checklists — se o formato do ciclo completo aparecer, degenerou em "SDD em miniatura"
- Derive do memory bank — não pergunte ao humano o que o projeto já sabe
- Implementação só após aprovação humana do contrato inteiro
- Se a elegibilidade estourar durante a execução: **pare** e proponha promoção para spec completa
- No fechamento: entrada no CHANGELOG obrigatória; ADR se mudou decisão arquitetural; artefato descartado

Para mais contexto e o exemplo de artefato preenchido, LOAD docs/JIT.md.

## Visão geral do ciclo

```
Memory Bank (lido no início de toda sessão)
     ↓
requirements.md → [aprovação humana] → design.md → [aprovação humana] → tasks.md → execução task-a-task
```

Para detalhes completos de cada etapa, LOAD references/workflow.md.
Para os checklists de cada etapa, LOAD references/checklists.md.

## Validação automática (sdd-validate)

Antes de `/revisar-spec` e depois de `/gerar-tasks`, rode o comando
`/validar-spec` — um sensor computacional determinístico (não substitui a
revisão humana, mas pega erros estruturais antes dela: IDs duplicados,
seções obrigatórias ausentes, T-APM-01 a T-APM-05 faltando, rastreabilidade
`[REQ-x.x]` incompleta). Corrija o que o validador reportar como `error`
antes de apresentar a spec ao humano. Detalhes de invocação em
`.apm/prompts/validar-spec.prompt.md`.

## Regras fundamentais (constitution.md)

1. **Observabilidade obrigatória** — todo código em produção deve ser instrumentado; T-APM-xx nunca são opcionais
2. **Separação funcional × técnica** — `requirements.md` = o QUÊ; `design.md` = o COMO
3. **Contrato de interface** — interfaces documentadas em `design.md` antes de qualquer código
4. **Rastreabilidade** — cada task referencia `[REQ-x.x]`; cada task APM referencia `[APM-Mx]`/`[APM-Ex]`
5. **Tamanho de task** — uma task = uma sessão de trabalho; subdividir se parecer grande
6. **Revisão humana** — aprovação explícita entre cada etapa; nunca avance sozinho
7. **Consistência com memory bank** — `design.md` sempre alinhado com `architecture.md`
8. **Commit semântico** — todos os commits seguem [Conventional Commits](https://www.conventionalcommits.org/pt-br/)

## Comportamentos proibidos

- **NÃO** incluir dados PII/sensíveis em exemplos de telemetria
- **NÃO** avançar para a próxima etapa sem aprovação humana explícita
- **NÃO** introduzir dependências externas não listadas em `architecture.md`
- **NÃO** alterar contratos de interface estabelecidos sem aprovação
- **NÃO** pular as tasks T-APM-xx mesmo que o humano não as mencione
- **NÃO** incluir tokens/secrets literais — sempre usar `${VAR}`
- **NÃO** misturar detalhes técnicos em `requirements.md`

## LOOP — auto-correção com limite determinístico

Ciclo interno ação → observação → ajuste (ex: rodar `/validar-spec`, ler os
`findings`, corrigir, rodar de novo). **Nunca** "tente até dar certo" —
limite padrão de **3 tentativas** por problema; esgotou sem sucesso →
aciona HANDOFF, não insista sozinho. Não é o "Steering Loop" de
`docs/HARNESS-FLOW.md` (aquele é retrospectiva humana entre ciclos, não
retry dentro de uma task). Detalhes e o exemplo com `sdd-validate`: LOAD
references/loop.md.

## HANDOFF — quando transferir o controle

Hoje só existe handoff **para o humano** (este framework só tem um agent,
`@sdd` — não há handoff agente→agente ainda). Gatilhos: limite do LOOP
atingido, conflito com `constitution.md`/`architecture.md`, contrato de
interface a alterar, dependência não aprovada, task ambígua, observabilidade
incompleta, ou qualquer ação potencialmente irreversível. Ao escalar, inclua
sempre o que foi tentado, por que falhou e a evidência (ex: JSON do
`sdd-validate`) — nunca escale só com "não funcionou, o que eu faço?".
Detalhes completos: LOAD references/handoff.md.

## Harness (guardrails) — hoje informal

O que já existe como guardrail é texto que o próprio agente segue por
disciplina, não código que bloqueia a ação: `constitution.md` imutável para
IA e a lista de "Comportamentos proibidos" acima. Guardrails **de
verdade** (enforced, não apenas orientação) seriam implementados como
**Hooks** (`PreToolUse`/`PostToolUse`) — um primitivo APM que este projeto
ainda não usa (`.apm/hooks/` não existe). Contexto conceitual completo do
Harness como um todo (guias + sensores): LOAD docs/HARNESS-FLOW.md.

Para o fluxo completo de cada etapa do ciclo, LOAD references/workflow.md.
