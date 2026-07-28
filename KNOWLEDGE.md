# KNOWLEDGE.md — Base de Conhecimento do Projeto

> Conhecimento acumulado sobre o projeto que todo agente deve ter.
> Atualize este arquivo quando aprender algo relevante e duradouro
> sobre o codebase, padrões emergentes ou decisões tomadas.

---

## Convenções de Nomenclatura

| Contexto              | Convenção             | Exemplo                         |
|-----------------------|-----------------------|---------------------------------|
| Métricas Application Performance Monitor | snake_case com pontos | `orders.checkout.duration_ms`   |
| Custom Events Application Performance Monitor     | PascalCase            | `OrderPlaced`                   |
| IDs de Requisito      | REQ-x.x               | `REQ-1.1`                       |
| IDs de APM Design     | APM-Mx / APM-Ex       | `APM-M1`, `APM-E2`              |
| IDs de Alertas        | ALT-xx                | `ALT-01`                        |
| IDs de Observabilidade| OBS-x                 | `OBS-1`                         |
| Specs folder          | kebab-case            | `specs/order-checkout/`         |

---

## Padrões Emergentes

> Documente aqui padrões que foram adotados na prática, mesmo que não estejam
> explicitamente na constitution ou architecture.

- **Mudanças de processo/comportamento do próprio framework** (sem API, sem
  dado, sem primitivo `.apm/` novo — ex: JIT Spec, futuras camadas da
  pirâmide Context → SDD → Harness → Loop, issue #3) não cabem bem no
  `design.md` genérico de `_template/` (pensado para software com API/dados)
  nem no `agent-context.md` (pensado para empacotar primitivos). Para esse
  tipo de mudança, entregar direto como documentação/instrução de agente e
  promover a decisão para cá é preferível a forçar um `design.md` com seções
  que não se aplicam.

- **Sensor computacional para spec** (`sdd-validate`, `.sdd/specs/harness-sensors/`):
  quando uma feature é, ela mesma, um CLI síncrono de processo único (sem
  chamadas de rede), o modelo APM padrão do framework se adapta assim:
  traces = N/A (documentado, não omitido); métricas (Counter/Histogram) sem
  um SDK real de métricas viram apenas campos de um evento `ValidationRun`
  emitido como JSON line em **stderr** — nunca em stdout, para não quebrar o
  contrato `--format=json` que precisa continuar sendo um único documento
  JSON parseável. A escolha de runtime (Node.js/TypeScript) foi
  deliberadamente deixada em aberto no `design.md` e resolvida só na
  primeira task de implementação (T-IMP-01), depois de checar que não havia
  nenhum sinal de linguagem já em uso no repositório.

- **Declaração vs. menção ao parsear IDs de spec** (`REQ-x.x`, `OBS-x`,
  `APM-Mx`/`APM-Ex`, `T-IMP/APM/DOC-xx`): checar unicidade/presença de IDs
  por regex simples gera falsos positivos, porque specs reais citam IDs em
  prosa como exemplo (`` `REQ-1.1` `` entre crases, "APM-M1..M5" em
  checklist, "OBS-1 → APM-M1..M4" em mapeamentos) sem que isso seja uma
  nova declaração. Um ID só deve contar para regras de unicidade/presença
  quando é o conteúdo de uma célula de tabela (célula só de IDs/separadores,
  cobrindo listas como "OBS-1, OBS-4") ou está envolto em `**[ID]**`. Esse
  padrão foi descoberto rodando o próprio `sdd-validate` contra sua spec de
  origem — um bom lembrete de que testar uma ferramenta de validação de
  specs contra specs reais do próprio repo expõe bugs que fixtures
  artificiais não expõem.

- **Skill em 4 quadrantes (SDD / Harness / Loop / Handoff)** — a skill
  `sdd-workflow` foi reestruturada para expor explicitamente 4 partes.
  Duas colisões de nome foram resolvidas conscientemente, não por acidente:
  - **Loop** (o ciclo interno ação→observação→ajuste do agente, com limite
    determinístico de tentativas) é **diferente** do "Steering Loop" já
    documentado em `docs/HARNESS-FLOW.md` (retrospectiva humana entre
    ciclos SDD). Os dois nomes convivem, descrevendo mecanismos distintos
    — não confundir um com o outro.
  - **Harness**, como quadrante da skill, é o subconjunto "guardrails &
    audit" (hoje só orientação textual — constitution imutável,
    comportamentos proibidos) — não o mesmo "Harness" guarda-chuva que
    `docs/HARNESS-FLOW.md` usa para o framework inteiro (guias + sensores).
    Guardrails *enforced* de verdade (não apenas orientação que o agente
    pode ignorar) mapeiam para **Hooks**, um primitivo APM que na época
    desta decisão ainda não era usado neste repo — ficou fora de escopo.
    Atualização (2026-07-28): o primeiro Hook do projeto foi adicionado
    (`.apm/hooks/proteger-constitution.json`, bloqueia escrita direta em
    `constitution.md`) — ver `.sdd/specs/harness-guardrails/agent-context.md`.
    Guardrail funcional real (o hook bloqueando de fato no Claude Code)
    ainda pendente de teste manual pelo humano.
  - **Handoff** (transferência explícita de controle) só cobre IA→humano
    hoje — handoff agente→agente não é aplicável enquanto só existir o
    agent `@sdd`; documentado como capacidade futura, não construído.

---

## Decisões e Aprendizados

> Registro de decisões pontuais e lições aprendidas durante o uso do framework.

| Data       | Contexto                  | Decisão / Lição                          |
|------------|---------------------------|------------------------------------------|
| 2026-07-16 | Fechamento da spec `jit-spec` | JIT Spec é uma **alternativa independente** ao ciclo SDD, não um componente dele — nunca aninhar sua documentação ou seu armazenamento dentro de `.sdd/`. Artefatos efêmeros vivem em `.jit/<nome>.md`, na raiz, como namespace de primeiro nível próprio (paralelo a `.apm/` e `.sdd/`). A spec `.sdd/specs/jit-spec/` foi descartada após esta promoção — a entrega real está em `docs/JIT.md`, `AGENTS.md`, `SKILL.md` e `references/workflow.md`. |
| 2026-07-27 | Implementação da spec `harness-sensors` (`sdd-validate`) | Primeira ferramenta de CLI do framework — decidido que código executável vive em `tools/<nome>/` (pacote Node/TS autocontido), nunca na raiz do repositório (que é 100% documentação). Runtime Node.js/TypeScript escolhido por T-IMP-01 na ausência de qualquer sinal prévio de linguagem no repo. Ver `architecture.md` → "Runtime para ferramentas de CLI do framework" para o registro completo. |
| 2026-07-27 | T-DOC-03 de `harness-sensors` (verificar `product.md`) | `product.md` está totalmente não inicializado ([PREENCHER] em toda seção) — decidido **não** preencher unilateralmente (persona/KPI de produto é decisão do humano, não do agente). T-DOC-03 fica pendente até uma inicialização de memory bank (`/init-memory-bank`) tratar `product.md` como um todo. |
| 2026-07-28 | Primeiro Hook do projeto (`harness-guardrails`, protege `constitution.md`) | Nem `docs/AGENT-PACKAGE-MANAGER.md` (mostrava lista) nem `.sdd/specs/_template/agent-context.md` (mostrava script) descreviam o schema real de Hooks aceito pelo `apm install` — descoberto por tentativa/observação/ajuste: `{"hooks": {"<Evento>": [ {entradas} ] } }` (dict com o evento como chave, valor é lista, sem campo `type` redundante dentro de cada entrada). Registrar aqui para a próxima sessão não repetir a mesma investigação. Bloqueio funcional real (Claude Code de fato interpretando o schema compilado) ainda não confirmado — "compila sem erro" não é prova de enforcement; teste manual pendente. |
| 2026-07-28 | Correção do hook `proteger-constitution` (bug de bootstrap) | A versão inicial bloqueava `write_file` **e** `edit_file` — mas `/init-memory-bank.prompt.md` usa `Write` para criar `constitution.md` do zero num projeto novo, e a condição `filepath contains X` não distingue "criar" de "sobrescrever". Isso quebraria a inicialização de todo projeto novo. **Padrão a lembrar**: para guardrails de arquivo baseados só em filepath (sem checagem de existência disponível), bloquear `Edit` é seguro (exige arquivo pré-existente, nunca cria), mas bloquear `Write`/`write_file` só é seguro se o arquivo nunca precisar ser criado por essa via — senão quebra o fluxo de bootstrap. |

---

## Retrospectivas de Spec

> Registro de retrospectivas conduzidas ao fechar specs.
> Use para identificar tendências e melhorar o processo SDD ao longo do tempo.
> Alimentado pela fase "Retrospectiva do Ciclo" descrita em `AGENTS.md`.

| Data | Spec | O que funcionou | O que melhorar | Ação no framework |
|------|------|-----------------|----------------|-------------------|
| —    | —    | —               | —              | —                 |

---

## FAQs para Agentes

**Q: Posso pular as tasks de Application Performance Monitor se o humano não as mencionar?**
A: Não. As tasks T-APM-xx são obrigatórias pela constitution.md.

**Q: O que fazer se requirements.md tiver detalhes técnicos?**
A: Reporte ao humano. Mova os detalhes técnicos para design.md e mantenha
   requirements.md no nível funcional.

**Q: Com que tamanho de problema devo usar o fluxo completo SDD?**
A: Problemas de tamanho médio (estimativa 3–8 pontos). Mudanças triviais
   (typo, cosmético) vão direto ao código, sem spec. Mudanças pequenas
   (1 componente, ≤2 arquivos, sem decisão arquitetural ou telemetria nova)
   usam o **JIT Spec** — uma alternativa ao fluxo completo, não uma etapa
   dele: contrato de artefato único com um gate humano (ver `docs/JIT.md`).

**Q: Como saber se um spec-first está terminado e pode ser descartado?**
A: Quando o checklist final de `tasks.md` estiver 100% marcado e o humano
   tiver aprovado a entrega. Informações arquiteturais relevantes devem ser
   promovidas para `architecture.md` antes de descartar o spec.
