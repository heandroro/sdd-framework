---
name: sdd-workflow
description: Use when the user is working on files inside .sdd/ or mentions spec, requirements, design, tasks, memory bank, or APM in a spec-driven development context. Provides the complete SDD workflow and checklists for the full cycle, plus the lighter JIT Spec alternative for small changes and the sdd-validate computational sensor.
---

# SDD Workflow

## Quando consultar este guia

Consulte quando o usuário estiver:
- Criando ou editando arquivos em `.sdd/specs/` ou `.sdd/memory-bank/`
- Perguntando sobre o ciclo SDD (requirements, design, tasks)
- Executando tasks de um `tasks.md`
- Promovendo decisões para `architecture.md` ou `adr/`
- Usando os comandos `/criar-spec`, `/revisar-spec`, `/gerar-tasks`, `/promover-adr`

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

## Quando reportar ao humano antes de prosseguir

- Conflito entre spec e `constitution.md` ou `architecture.md`
- Task que precisa alterar contrato de interface existente
- Dependência não listada em `architecture.md`
- Task ambígua com múltiplas interpretações válidas
- Requisito de observabilidade incompleto ou inconsistente

Para o fluxo completo de cada etapa do ciclo, LOAD references/workflow.md.
