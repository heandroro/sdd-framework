# HANDOFF — Transferência de Controle

> Handoff é a transferência **explícita** de controle da execução para
> outra entidade, quando um limite é atingido ou uma especialização
> diferente é necessária. Existem dois tipos possíveis — só um deles é
> aplicável hoje neste framework.

HANDOFF é um dos 4 quadrantes que compõem a capacidade de um agente de IA
neste framework — ver [SKILL-ARCHITECTURE.md](SKILL-ARCHITECTURE.md) para
o diagrama completo e como os quadrantes se relacionam.

---

## Os dois tipos de handoff

```
 ┌──────────────────────┐
 │  HANDOFF → HUMANO    │  → aplicável hoje. O agente reconhece um limite
 │  (Human-in-the-Loop) │    (LOOP esgotado, ação sensível, ambiguidade)
 │                       │    e transfere a decisão para uma pessoa.
 └──────────────────────┘

 ┌──────────────────────┐
 │  HANDOFF → AGENTE    │  → NÃO aplicável hoje. Um agente especializado
 │  (Multi-Agent Routing)│   passaria contexto/estado para outro agente
 │                       │    especializado — exige múltiplas personas,
 └──────────────────────┘    que este framework ainda não tem.
```

## Handoff → Humano (aplicável hoje)

### Quando fazer

- O limite de tentativas do LOOP foi atingido — ver `docs/LOOP.md`
- Conflito entre o trabalho em curso e uma decisão já registrada
  (arquitetura, princípios imutáveis)
- Uma mudança que alteraria um contrato de interface já estabelecido
- Uma dependência externa nova, ainda não aprovada
- Ambiguidade real — múltiplas interpretações válidas, nenhuma claramente
  correta
- Requisito de observabilidade incompleto ou inconsistente
- Qualquer ação potencialmente destrutiva ou irreversível fora do que já
  foi explicitamente aprovado para a sessão

### O pacote de handoff

Ao escalar para o humano, **sempre inclua**:

1. **O que foi tentado** — passos concretos, não "tentei várias vezes"
2. **Por que falhou** — a causa identificada em cada tentativa, se souber
3. **Evidência** — saída relevante de sensores/ferramentas usadas, sem
   resumir a ponto de perder detalhes acionáveis (ex: qual regra falhou,
   em qual arquivo, em qual linha)
4. **Uma recomendação**, se tiver — deixando claro que é sugestão, não
   decisão já tomada

Escalar só com "não funcionou, o que eu faço?" empurra para o humano o
trabalho de reconstruir um contexto que quem escala já tinha.

### Depois do handoff

- Não continuar tentando resolver o mesmo problema enquanto aguarda
  resposta
- Uma instrução nova do humano encerra o handoff — o LOOP recomeça com a
  estratégia nova

## Handoff → Agente (não aplicável hoje)

Roteamento entre múltiplos agentes especializados exige, antes de tudo,
que existam múltiplos agentes especializados — hoje isso não é o caso
neste framework. Inventar um fluxo de handoff agente→agente sem essa base
seria descrever uma capacidade que não existe.

Se um cenário futuro justificar múltiplos agentes, este é o lugar certo
para registrar os critérios de roteamento entre eles — até lá, todo
handoff é para o humano.

## Exemplo

Cenário: o agente rodou um validador de spec, encontrou um erro, corrigiu,
rodou de novo — três vezes seguidas, sempre com um erro diferente
aparecendo. Na terceira falha, em vez de tentar uma quarta correção, o
agente para e escala:

> "Tentei corrigir X três vezes (detalhes: tentativa 1 → Y, tentativa 2 →
> Z, tentativa 3 → W) e o erro muda a cada vez, sugerindo que o problema
> real pode ser outro. Evidência: [saída do validador anexada]. Minha
> suspeita é [hipótese], mas prefiro confirmar antes de tentar de novo."

Isso é um handoff bem-formado: mostra o que foi tentado, por que parou, a
evidência, e uma recomendação sem se apresentar como decisão tomada.
