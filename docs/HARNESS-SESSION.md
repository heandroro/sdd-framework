# Harness Session — Guia de Uso

Como o harness SDD se comporta na prática: exemplos de sessão para cada
situação do ciclo de vida do harness.

> Para os diagramas de referência do harness completo, veja [HARNESS-FLOW.md](HARNESS-FLOW.md).
> Para o ciclo SDD em si, veja [SDD-SESSION.md](SDD-SESSION.md).

---

## O que muda com o harness?

Sem harness, o agente depende apenas do seu contexto imediato e tende a
repetir os mesmos erros. Com o harness SDD ativo, dois mecanismos entram em
jogo antes de qualquer artefato chegar à revisão humana:

1. **Guias (feedforward)** — o agente já sabe as regras antes de agir
2. **Sensores (feedback)** — o agente verifica o que produziu e corrige

Os exemplos abaixo mostram esses mecanismos em ação.

---

## Sessão 1 — Sensor computacional: validando uma spec antes da revisão humana

> O agente acabou de gerar um `tasks.md`. Antes de apresentar ao humano, executa
> o sensor computacional.

> **Agente:** *(gerou `tasks.md` para a feature `checkout-v2`)* Spec gerada.
> Executando `sdd-validate` antes de apresentar...
>
> ```
> $ sdd-validate .sdd/specs/checkout-v2 --format=text
>
> [ERROR] tasks.md:47 · R008 — T-APM-04 ausente. Tasks obrigatórias faltando: T-APM-04, T-APM-05
>         Sugestão: adicione as tasks T-APM-04 (Alertas) e T-APM-05 (Dashboard) ao tasks.md
> [WARN]  tasks.md:23 · R009 — Task T-IMP-03 não contém referência [REQ-x.x]
>         Sugestão: adicione [REQ-2.1] ao título ou descrição da task
>
> 1 erro · 1 aviso · exit 1
> ```
>
> Encontrei 2 problemas. Corrigindo antes de apresentar:
> - Adicionando `T-APM-04` e `T-APM-05` ao `tasks.md`
> - Adicionando `[REQ-2.1]` à descrição de `T-IMP-03`
>
> *(corrige e re-executa)*
>
> ```
> $ sdd-validate .sdd/specs/checkout-v2 --format=text
>
> ✓ 0 erros · 0 avisos · exit 0
> ```
>
> Pronto. `tasks.md` validado — pode revisar.

> **Usuário:** *(revisa)* aprovado.

> **ℹ️** Sem o sensor, as tasks T-APM ausentes só seriam detectadas na revisão humana —
> o que geraria um ciclo de revisão extra. O sensor move esse custo para dentro do loop
> do agente.

---

## Sessão 2 — Sensor computacional: bloqueando spec inválida no CI

> Um desenvolvedor cria um `requirements.md` e abre um PR. O pipeline de CI executa
> `sdd-validate` como step de validação.

```yaml
# .github/workflows/sdd-validate.yml (exemplo)
- name: Validate SDD specs
  run: sdd-validate --format=json | tee sdd-report.json
```

> ```
> [CI] Running sdd-validate...
>
> [ERROR] requirements.md:12 · R001 — Seção "Quais falhas precisam gerar alertas imediatos?"
>         não contém nenhum item OBS-x. Mínimo: 1 item por subseção.
> [ERROR] requirements.md:31 · R003 — ID duplicado: REQ-2.1 aparece nas linhas 31 e 48.
> [WARN]  requirements.md:5  · R002 — [PREENCHER] encontrado: "## Contexto da Feature"
>
> 2 erros · 1 aviso · exit 1
> [CI] ❌ Build failed — spec inválida. Corrija os erros antes do merge.
> ```

> O PR é bloqueado. O desenvolvedor corrige os dois erros (`OBS-5` adicionado,
> ID `REQ-2.1` duplicado resolvido) e reabre. O CI passa.

> **ℹ️** O aviso `R002` sobre `[PREENCHER]` não bloqueia o build por padrão.
> Use `--strict` para tratar avisos como erros em specs que precisam estar 100% preenchidas.

---

## Sessão 3 — Sensor inferencial: revisão de spec sob demanda

> O agente gerou um `design.md` e o humano quer uma segunda opinião antes de aprovar.

> **Usuário:** `/revisar-spec design checkout-v2`
>
> **Agente:** *(lê `requirements.md`, `design.md` e `architecture.md`)* Revisão do `design.md` de `checkout-v2`:
>
> ✅ Seção APM presente com APM-M1..M4 e APM-E1..E2
> ✅ Todos os OBS-x têm cobertura APM (OBS-1→APM-M1, OBS-2→APM-E1, OBS-3→APM-M2)
> ✅ Alinhado com `architecture.md` — nenhuma dependência nova não listada
> ⚠️ **Atenção**: O contrato de interface define `POST /api/checkout` mas `architecture.md`
>    registra que todos os endpoints de pagamento devem usar o prefixo `/api/v2/`.
>    Sugestão: alinhar para `POST /api/v2/checkout` ou promover exceção como ADR.
>
> 1 atenção — aguardo sua decisão antes de aprovar.

> **Usuário:** faz sentido, corrige para `/api/v2/checkout`.
>
> **Agente:** *(atualiza `design.md`)* Corrigido. Pronto para aprovação.

---

## Sessão 4 — Steering loop: problema recorre → harness atualizado

> Durante a retrospectiva de três specs seguidas, o mesmo problema aparece:
> times esquecendo de preencher `OBS-5` (alertas críticos).

> **Usuário:** *(após retrospectiva)* todo spec está saindo sem OBS-5 preenchido.
> já é o terceiro ciclo.
>
> **Agente:** Problema recorrente identificado. Temos dois caminhos:
>
> | Opção | Tipo de controle | O que muda |
> |---|---|---|
> | A | **Sensor** | A regra R001 do `sdd-validate` já captura OBS-5 ausente — garantir que o validador está no pre-commit hook |
> | B | **Guia** | Adicionar exemplo explícito de OBS-5 no template `requirements.md` e na skill `sdd-workflow` |
> | A + B | **Ambos** | Sensor bloqueia, guia previne — mais robusto |
>
> Recomendo A + B. Posso iniciar pelas duas mudanças?

> **Usuário:** sim
>
> **Agente:** *(atualiza `_template/requirements.md` — adiciona exemplo OBS-5 preenchido)*
> *(atualiza `sdd-workflow/references/checklists.md` — adiciona item explícito para OBS-5)*
>
> Feito. Registrei em `KNOWLEDGE.md → Decisões e Aprendizados`:
> ```
> | 2026-05-19 | OBS-5 recorrentemente ausente | Adicionado exemplo no template
>   e checklist na skill sdd-workflow. Sensor R001 já captura — garantir pre-commit. |
> ```

---

## Sessão 5 — Guia feedforward em ação: nova decisão arquitetural no contexto

> O time acabou de adotar Redis para cache. O agente vai criar um `design.md` e
> o novo padrão ainda não estava no `architecture.md`.

> **Usuário:** `/promover-adr adoção de Redis para cache de sessão`
>
> **Agente:** Criando ADR. Antes de registrar em `architecture.md`, confirme:
> - **Escopo**: apenas cache de sessão, ou Redis como padrão geral de cache?
> - **Restrições**: versão mínima? autenticação obrigatória (TLS + AUTH)?
>
> **Usuário:** padrão geral de cache, Redis 7+, TLS obrigatório.
>
> **Agente:** *(atualiza `architecture.md` → seção "Dependências Externas")* ADR promovido.
>
> A partir desta sessão, quando eu criar qualquer `design.md` que envolva cache,
> o `architecture.md` já estará no memory bank e vou sugerir Redis 7+ com TLS
> automaticamente — sem precisar ser lembrado.

> **ℹ️** Este é o feedforward em ação: o guia (`architecture.md`) foi atualizado uma vez
> e passa a influenciar todas as specs futuras sem intervenção humana repetida.

---

## Sessão 6 — Sensor de runtime (pós-entrega): APM em produção

> A feature `checkout-v2` foi entregue. Os eventos APM definidos no `design.md`
> estão chegando no sistema de observabilidade.

> **Usuário:** o ALT-02 disparou — taxa de erro no checkout acima de 2% nas últimas 2h.
>
> **Agente:** *(consulta o runbook via skill)* ALT-02: `checkout.payment.errors.rate > 2%`.
> Passos do runbook:
> 1. Verificar logs com `correlationId` das requisições com erro
> 2. Checar disponibilidade do gateway de pagamento externo
> 3. Se gateway estável, verificar mudanças recentes no serviço de checkout
>
> Posso abrir uma investigação? Preciso de acesso aos logs ou devo gerar um spec
> de hotfix com base no que o alerta reporta?
>
> **Usuário:** gera um spec de hotfix.
>
> **Agente:** `/criar-spec checkout-v2-hotfix` — iniciando `requirements.md`...

> **ℹ️** O sensor de runtime (ALT-02) detectou o problema. O harness fechou o loop:
> observabilidade → alerta → novo ciclo SDD para correção.

---

## Mapa de Sessões × Tipo de Controle

| Sessão | Controle | Tipo | Quando ocorre |
|---|---|---|---|
| 1 — Validator antes da revisão | Sensor computacional | Feedback | Durante geração do agente |
| 2 — Validator no CI | Sensor computacional | Feedback | Pre-commit / pipeline |
| 3 — `/revisar-spec` | Sensor inferencial | Feedback | Sob demanda, antes do gate humano |
| 4 — Steering loop / retrospectiva | Ambos (guia + sensor) | Melhoria do harness | Pós-ciclo, quando problema recorre |
| 5 — `/promover-adr` | Guia feedforward | Feedforward | Quando decisão arquitetural emerge |
| 6 — APM em produção | Sensor de runtime | Feedback | Pós-entrega, contínuo |

---

## Primitivos do Harness

| Como invocar | Tipo | O que faz |
|---|---|---|
| `sdd-validate [dir]` | Sensor computacional | Valida estrutura de specs — erros, avisos, exit code para CI |
| `sdd-validate --format=json` | Sensor computacional | Output estruturado para LLM ou pipeline |
| `sdd-validate --strict` | Sensor computacional | Trata warnings como errors — para specs 100% preenchidas |
| `/revisar-spec <etapa>` | Sensor inferencial | Revisão semântica de spec com IA como juiz |
| `/promover-adr <decisão>` | Guia feedforward | Atualiza `architecture.md` — influencia specs futuras |
| `@sdd` + retrospectiva | Loop de direção | 9 perguntas → `KNOWLEDGE.md` → harness melhorado |
