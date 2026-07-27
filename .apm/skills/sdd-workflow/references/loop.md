# LOOP — Ciclo de Auto-Correção do Agente

> **Isto não é o "Steering Loop" de `docs/HARNESS-FLOW.md`** — aquele é uma
> retrospectiva **humana** entre ciclos SDD (problema recorrente → 9
> perguntas → atualiza `KNOWLEDGE.md` → melhora um guia/sensor). O LOOP
> descrito aqui é o ciclo **dentro de uma única task**: pensamento → ação →
> observação, rodando várias vezes até dar certo ou estourar o limite.

## Como funciona

1. **Ação**: o agente executa algo (rodar um comando, editar um arquivo,
   invocar `sdd-validate`, chamar uma API).
2. **Observação**: o resultado (sucesso, erro, saída de um sensor) volta
   para o próprio agente.
3. **Ajuste**: se houve erro, o agente analisa a causa e corrige a
   estratégia — não repete a mesma ação esperando um resultado diferente.
4. **Repetição**: volta ao passo 1, até o resultado ser aceitável ou o
   limite de tentativas ser atingido.

## Limite determinístico (obrigatório)

Todo LOOP precisa de um teto explícito antes de começar — nunca "tente até
dar certo":

- **Padrão**: no máximo **3 tentativas** por problema. Ajustável para
  contextos específicos (ex: uma correção trivial de formatação pode ter
  limite menor; uma investigação de causa-raiz mais complexa pode justificar
  mais tentativas, mas isso deve ser explícito, não implícito).
- Se as 3 tentativas se esgotarem sem sucesso: **pare** — não tente uma
  quarta vez "só mais uma". Isso aciona HANDOFF (LOAD references/handoff.md).
- Contar tentativas mentalmente não é confiável em sessões longas — ao
  perceber que já é a 2ª ou 3ª tentativa do mesmo problema, diga isso
  explicitamente ("essa é a 3ª tentativa de corrigir X") antes de decidir
  se continua ou escala.

## Exemplo concreto: `sdd-validate` como sensor de observação

O caso mais comum de LOOP no ciclo SDD é a correção de uma spec:

1. **Ação**: agente termina de gerar/editar `tasks.md` (ou qualquer etapa).
2. **Observação**: roda `/validar-spec` (LOAD .apm/prompts/validar-spec.prompt.md).
3. **Ajuste**: se `sdd-validate` reportar `error` (ex: T-APM ausente, ID
   duplicado), corrige exatamente o que a `suggestion` de cada finding indica
   — não corrige "no escuro".
4. **Repetição**: roda `/validar-spec` de novo. Se limpo (`errors: 0`),
   sai do loop e segue pro gate humano normal (`/revisar-spec`). Se ainda
   houver erro após 3 rodadas, é HANDOFF — não insista sozinho.

Este é o mesmo padrão do exemplo em `docs/HARNESS-SESSION.md` (Sessão 2):
erro → correção → nova validação → sucesso.

## Regras

- **NÃO** repita a mesma ação sem mudar nada esperando resultado diferente
  — cada tentativa deve incorporar o que foi aprendido na anterior
- **NÃO** esconda o número de tentativas do humano quando fizer handoff —
  o pacote de handoff (LOAD references/handoff.md) deve listar o que foi
  tentado
- **NÃO** trate limite de tentativas como sugestão — é um teto rígido
- Erros de orçamento/custo (muitas chamadas de ferramenta, contexto
  grande) também contam como razão para encerrar o loop, não só erros
  funcionais
