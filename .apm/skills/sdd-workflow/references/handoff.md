# HANDOFF — Transferência de Controle

Handoff é a transferência **explícita** do controle da execução para outra
entidade quando um limite é atingido ou uma especialização diferente é
necessária. Existem dois tipos possíveis — só um deles é aplicável hoje
neste framework.

## Handoff → Humano (HITL) — aplicável hoje

### Quando fazer

- O limite do LOOP foi atingido (LOAD references/loop.md) — 3 tentativas
  sem sucesso no mesmo problema
- Conflito entre a spec e `constitution.md` ou `architecture.md`
- Task que precisa alterar um contrato de interface já estabelecido
- Dependência externa não listada em `architecture.md`
- Task ambígua, com múltiplas interpretações válidas e nenhuma claramente
  correta
- Requisito de observabilidade incompleto ou inconsistente
- Qualquer ação potencialmente destrutiva ou irreversível fora do que já
  foi aprovado explicitamente para a sessão

### O pacote de handoff

Ao escalar para o humano, **sempre inclua**:

1. **O que foi tentado** — passos concretos, não "tentei corrigir várias
   vezes"
2. **Por que falhou** — a causa identificada em cada tentativa, se souber
3. **Evidência/auditoria** — saída relevante de sensores (ex: JSON do
   `sdd-validate`, mensagem de erro literal), nunca resumida a ponto de
   perder o `ruleId`/linha/mensagem originais
4. **O que você recomenda**, se tiver uma opinião — mas deixe claro que é
   uma sugestão, não uma decisão já tomada

Nunca escale com só "não funcionou, o que eu faço?" sem o pacote acima —
isso empurra pro humano o trabalho de reconstruir o contexto que o agente
já tinha.

### Depois do handoff

- Não continue tentando resolver o mesmo problema enquanto aguarda resposta
- Se o humano der uma instrução nova, isso encerra o handoff — volte ao
  LOOP normal com a nova estratégia

## Handoff → Agente (roteamento multi-agente) — não aplicável hoje

Este framework hoje só tem **um** agent primitivo (`@sdd`,
`.apm/agents/sdd.agent.md`). Não existe outro agente/persona para o qual
delegar, então **não invente um handoff agente→agente** — isso exigiria
primeiro decidir e construir novas personas especializadas, o que é uma
decisão de design separada, não coberta por esta skill.

Se um cenário futuro justificar múltiplos agentes especializados, este
documento é o lugar certo para registrar os critérios de roteamento entre
eles — mas até lá, todo handoff é para o humano.
