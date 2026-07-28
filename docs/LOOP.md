# LOOP — Ciclo de Auto-Correção do Agente

> **Não confundir com o "Steering Loop"** (`docs/HARNESS-FLOW.md` → "O Loop
> de Direção"). O Steering Loop é retrospectiva **humana** entre ciclos SDD
> (problema recorre → 9 perguntas → melhora um guia/sensor). O LOOP descrito
> aqui é interno a uma única task: o agente tentando, observando o
> resultado e ajustando, sozinho, dentro da mesma execução. Dois
> mecanismos diferentes — a colisão de nome é intencional, não um erro.

LOOP é um dos 4 quadrantes que compõem a capacidade de um agente de IA
neste framework — ver [SKILL-ARCHITECTURE.md](SKILL-ARCHITECTURE.md) para
o diagrama completo e como os quadrantes se relacionam.

---

## O que é

O ciclo interno de **pensamento → ação → observação** pelo qual um agente
resolve um problema sem precisar de uma resposta certeira na primeira
tentativa. Em vez de tratar cada ação como definitiva, o agente trata o
resultado de cada ação como **informação para a próxima tentativa**.

## Como funciona

```
 ┌──────────────────┐
 │  AÇÃO            │  → o agente executa algo: rodar comando, editar
 │                  │    arquivo, invocar um sensor (ex: sdd-validate)
 └────────┬─────────┘
          ▼
 ┌──────────────────┐
 │  OBSERVAÇÃO      │  → o resultado (sucesso, erro, findings de um
 │                  │    sensor) volta para o próprio agente
 └────────┬─────────┘
          ▼
 ┌──────────────────┐
 │  AJUSTE          │  → se houve erro, analisa a causa e muda a
 │                  │    estratégia — não repete a mesma ação esperando
 └────────┬─────────┘    resultado diferente
          │
          │  resultado aceitável?
          ├─── sim ──→ fim do loop, segue em frente
          │
          └─── não, e ainda dentro do limite ──→ volta para AÇÃO
               não, e limite esgotado (3ª tentativa falhou) ──→ HANDOFF
```

## Limite determinístico (obrigatório)

Todo LOOP precisa de um teto explícito **antes de começar** — nunca "tente
até dar certo":

- **Padrão**: no máximo **3 tentativas** por problema. Ajustável para
  contextos específicos, mas o ajuste deve ser explícito, não implícito.
- Esgotou as tentativas sem sucesso → **para** e escala (ver `HANDOFF.md`)
  — não tenta uma 4ª vez "só mais uma".
- Ao perceber que já é a 2ª ou 3ª tentativa do mesmo problema, isso deve
  ser dito explicitamente, não deixado implícito na conversa.
- Orçamento (muitas chamadas de ferramenta, contexto grande) também conta
  como razão válida para encerrar o loop — não só erros funcionais.

## Exemplo: `sdd-validate` como sensor de observação

O caso mais comum deste framework é a correção de uma spec:

1. **Ação**: o agente termina de gerar ou editar um artefato de spec.
2. **Observação**: roda o validador de specs (`sdd-validate`) sobre o
   artefato.
3. **Ajuste**: se o validador reportar `error`, corrige exatamente o que a
   sugestão de cada finding indica — não corrige "no escuro".
4. **Repetição**: roda o validador de novo. Limpo → sai do loop. Ainda com
   erro após 3 rodadas → é caso de handoff, não de insistência.

Este é o mesmo padrão que aparece em `docs/HARNESS-SESSION.md` (Sessão 2):
erro → correção → nova validação → sucesso.

## Regras

- **Não** repetir a mesma ação sem mudar nada, esperando um resultado
  diferente — cada tentativa deve incorporar o que foi aprendido na
  anterior
- **Não** esconder o número de tentativas ao escalar — quem recebe o
  handoff precisa saber quantas vezes já foi tentado
- **Não** tratar o limite de tentativas como sugestão — é um teto rígido
- Erros de orçamento/custo também encerram o loop, não só erros funcionais
