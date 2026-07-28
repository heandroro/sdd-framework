# AGENTS.md — Instruções para Agentes de IA

> Este arquivo define como agentes de IA devem se comportar neste projeto.
> Deve ser incluído automaticamente no contexto de toda sessão de coding.

---

## Memory Bank (Leitura obrigatória no início de toda sessão)

Antes de qualquer ação, leia os seguintes arquivos na ordem:

1. `.sdd/memory-bank/constitution.md` — Princípios imutáveis
2. `.sdd/memory-bank/architecture.md` — Decisões arquiteturais
3. `.sdd/memory-bank/product.md` — Contexto de produto
4. `.sdd/memory-bank/apm-standards.md` — Padrões Application Performance Monitor

Se algum destes arquivos não existir, informe ao humano antes de prosseguir.

---

## Antes de qualquer mudança: qual caminho usar?

Faça a triagem de tamanho antes de escolher o workflow:

- **Trivial** (typo, comentário, ajuste cosmético) → direto ao código, sem spec
- **Pequena** (1 componente, até 2 arquivos de produção estimados, sem
  decisão arquitetural nova, sem telemetria nova) → **Workflow JIT Spec**
  (ver abaixo)
- **Média ou maior** → **Workflow SDD (Spec-First)** completo (ver abaixo)

> O Workflow JIT Spec **não é uma etapa** do Workflow SDD completo — é um
> caminho alternativo e mais leve. Uma mudança segue um dos dois, nunca
> os dois.

---

## Workflow SDD (Spec-First)

### Etapa 1 — Requirements

Quando solicitado a criar/ajudar com `requirements.md`:
1. Leia o memory bank completo
2. Preencha os requisitos funcionais separados de técnicos
3. Preencha os requisitos de observabilidade (seções OBS-x)
4. **Nunca inclua decisões técnicas em requirements.md**
5. Execute o checklist ao final e reporte qualquer item não atendido

### Etapa 2 — Design

Quando solicitado a criar/ajudar com `design.md`:
1. Confirme que `requirements.md` foi aprovado pelo humano
2. Verifique alinhamento com `architecture.md` antes de propor qualquer design
3. Preencha **obrigatoriamente** a seção Application Performance Monitor / Observability Design
4. Para cada requisito OBS-x em `requirements.md`, deve existir um correspondente em Application Performance Monitor Design
5. Execute o checklist ao final e reporte qualquer item não atendido

### Etapa 3 — Tasks

Quando solicitado a criar/ajudar com `tasks.md`:
1. Confirme que `design.md` foi aprovado pelo humano
2. Gere tasks de implementação com rastreabilidade para REQ-x.x
3. **Sempre inclua as tasks T-APM-01 a T-APM-05** — elas nunca são opcionais
4. **Sempre inclua as tasks T-DOC-01 a T-DOC-03** — elas nunca são opcionais
5. Tasks de Application Performance Monitor devem referenciar os IDs APM-Mx / APM-Ex de `design.md`
6. Execute o checklist ao final

### Validação Automática (sdd-validate)

Antes de cada gate humano (fim de `requirements.md`, `design.md` e depois de
gerar `tasks.md`), rode o sensor computacional de specs:

```
node tools/sdd-validate/bin/sdd-validate.js
```

(ou `/validar-spec`, se o Agent Package Manager estiver instalado). Ele
verifica IDs únicos, seções obrigatórias, T-APM-01 a T-APM-05 presentes e
rastreabilidade `[REQ-x.x]` — determinístico, não substitui a revisão
humana. Corrija todo finding `error` antes de apresentar a spec ao humano;
findings `warning` não bloqueiam, mas devem ser sinalizados.

### Execução de Tasks

Durante a execução:
- Execute UMA task por vez
- Antes de iniciar uma task, confirme com o humano
- Após completar, marque `[x]` e aguarde aprovação antes de prosseguir
- Se uma task parecer grande, proponha subdivisão primeiro

### Quando quebrar uma feature em sub-specs

Proponha a divisão em sub-specs **antes de iniciar o design** quando:
- `requirements.md` cobrir mais de 2 domínios de negócio distintos
- A estimativa de tasks ultrapassar 10 itens
- Componentes diferentes puderem ser entregues e testados de forma independente

Cada sub-spec fica em `.sdd/specs/<feature>-<componente>/` e tem seu próprio
ciclo SDD completo. Nunca divida tasks em múltiplos arquivos — `tasks.md` é sempre arquivo único.

### Retrospectiva do Ciclo

Após todas as tasks (incluindo T-DOC-xx) estarem concluídas, o agente deve
**oferecer** a condução de uma retrospectiva estruturada. O humano pode aceitar
ou recusar — a fase é opcional e não bloqueia o fechamento da spec.

**Quando oferecer**: ao verificar que o Checklist Final de `tasks.md` está
100% marcado.

**Como conduzir**: percorra as perguntas abaixo com o humano, uma por vez,
e registre os insights em `KNOWLEDGE.md → Retrospectivas de Spec`.

#### Bloco 1 — Qualidade do Spec

1. O `requirements.md` estava completo, ou surgiram lacunas funcionais durante o design ou a implementação?
2. O `design.md` precisou ser revisado após o início da implementação? Se sim, por quê?
3. O ciclo de aprovação humana (requirements → design → tasks) fluiu sem travamentos?

#### Bloco 2 — Tasks e Observabilidade

4. Alguma task precisou ser subdividida durante a execução? O tamanho das tasks estava adequado?
5. O design de telemetria (APM) cobriu o que era necessário, ou faltou algo?
6. As tasks T-APM foram executadas conforme planejado, ou houve surpresas?

#### Bloco 3 — Processo Geral

7. O que funcionou bem neste ciclo SDD?
8. O que seria feito diferente no próximo ciclo?
9. Algum padrão novo emergiu que deveria ser adotado como default no framework?

**Output esperado**: resumo conciso em `KNOWLEDGE.md → Retrospectivas de Spec`
(uma linha por item relevante na tabela, ação no framework quando aplicável).

---

## Workflow JIT Spec (alternativa ao ciclo completo — mudanças pequenas)

> Isto não é uma etapa do Workflow SDD acima — é um caminho separado e
> mais leve para mudanças pequenas. Contexto e exemplos em [JIT.md](docs/JIT.md).

1. Confirme que o memory bank está inicializado — sem ele, oriente o humano a
   inicializá-lo ou use o ciclo completo
2. Gere um **artefato único** (≤ ~20 linhas) **derivado do memory bank**:
   intenção (1–2 frases), critérios de aceite, componentes tocados e
   verificação de que a telemetria APM **existente** cobre o cenário
3. **Não pergunte ao humano o que já está no memory bank**
4. O artefato **não contém** IDs `REQ-x`, tabelas GIVEN/WHEN/THEN, seções
   `OBS-x` nem checklists — anti-formalismo é requisito
5. Apresente ao humano: **gate único** — implemente somente após aprovação
   explícita do contrato inteiro
6. **Regra de escalada**: se qualquer critério de elegibilidade estourar
   durante a execução, pare e proponha promoção para spec completa
7. No fechamento: entrada no `CHANGELOG.md` obrigatória; ADR se mudou decisão
   arquitetural; descarte o artefato JIT após o merge

---

## Loop de Auto-Correção

Ao executar uma ação (rodar comando, editar arquivo, invocar
`sdd-validate`), trate o resultado como observação para a próxima tentativa:
erro → analise a causa → ajuste a estratégia → tente de novo. **Limite
determinístico obrigatório: no máximo 3 tentativas** para o mesmo problema.
Esgotou sem sucesso → **pare** e reporte ao humano (ver "Quando Reportar ao
Humano (Handoff)" abaixo) — não tente uma 4ª vez "só mais uma".

> Isto não é o "Steering Loop" de [HARNESS-FLOW.md](docs/HARNESS-FLOW.md)
> (aquele é retrospectiva humana entre ciclos SDD, não retry dentro de uma
> task) — os dois nomes descrevem mecanismos diferentes, de propósito.

## Comportamentos Proibidos

- **NÃO** inclua dados PII/sensíveis em exemplos de telemetria
- **NÃO** avance para a próxima etapa sem aprovação humana explícita
- **NÃO** introduza dependências externas não listadas em `architecture.md`
- **NÃO** altere contratos de interface já estabelecidos sem aprovação
- **NÃO** pule as tasks T-APM-xx mesmo que o humano não as mencione
- **NÃO** pule as tasks T-DOC-xx mesmo que o humano não as mencione
- **NÃO** feche o ciclo de uma spec sem completar T-DOC-01 a T-DOC-03
- **NÃO** inclua tokens/secrets literais em exemplos de `apm.yml` — sempre usar `${VAR}`
- **NÃO** misture detalhes técnicos em `requirements.md`
- **NÃO** inclua IDs `REQ-x`, tabelas GIVEN/WHEN/THEN, seções `OBS-x` ou checklists em um artefato JIT spec — se o formato do ciclo completo aparecer, o fluxo degenerou
- **NÃO** continue a execução de um JIT spec cuja elegibilidade estourou — pare e proponha promoção para spec completa

Estas regras são orientação seguida por disciplina — não há nenhum
mecanismo automático (Hooks) que bloqueie a ação caso sejam violadas neste
repositório hoje. Guardrails "de verdade" (enforced por código, não só
texto) ficam fora do escopo atual.

---

## Quando Reportar ao Humano (Handoff)

Handoff é a transferência **explícita** de controle para o humano — hoje a
única forma de handoff neste framework (não há handoff agente→agente; só
existe o fluxo direto do agente, sem múltiplas personas).

Reporte **imediatamente** ao humano antes de prosseguir quando:
- O limite do Loop de Auto-Correção foi atingido (3 tentativas sem sucesso
  no mesmo problema — ver seção acima)
- Houver conflito entre o spec e `constitution.md` ou `architecture.md`
- Uma task precisar alterar um contrato de interface existente
- Uma dependency não listada em `architecture.md` for necessária
- A task for ambígua ou tiver múltiplas interpretações válidas
- Um requisito de observabilidade parecer incompleto ou inconsistente
- Um primitivo de agente (PKG-x) conflitar com primitivos já instalados por outros pacotes APM CLI
- Um MCP server self-defined precisar ser usado transitivamente (boundary de segurança)
- Qualquer ação potencialmente destrutiva ou irreversível fora do que já foi explicitamente aprovado para a sessão

**Ao reportar, sempre inclua** (o "pacote de handoff"): o que foi tentado,
por que falhou, a evidência relevante (ex: saída JSON do `sdd-validate`,
mensagem de erro literal) e, se tiver, uma recomendação — deixando claro
que é sugestão, não decisão já tomada. Nunca escale só com "não funcionou,
o que eu faço?".

---

## Workflow Agent Package Manager (APM CLI) (Agent Context)

> Este workflow é **independente** do ciclo SDD. Pode ser iniciado em paralelo,
> antes ou depois do ciclo `requirements → design → tasks`, dependendo da maturidade
> da feature. Use `.sdd/specs/_template/agent-context.md` como template.
> Documentação completa dos primitivos: [AGENT-PACKAGE-MANAGER.md](docs/AGENT-PACKAGE-MANAGER.md).

### Quando usar

- A feature precisa ensinar algo ao agente (regras, guias, workflows)
- A feature expõe comandos que o usuário deve invocar via agente (`/comando`, `@persona`)
- A feature precisa integrar MCP servers no contexto do agente
- O time quer padronizar como o agente age em arquivos/domínios desta feature

### Etapa PKG-1 — Definir Primitivos

1. Copie `.sdd/specs/_template/agent-context.md` para a pasta da feature
2. Preencha a seção **Propósito do Pacote** (o humano preenche, a IA pode sugerir)
3. Liste os primitivos necessários (Instructions, Prompts, Agents, Skills, Hooks, MCP)
4. Atribua IDs PKG-Ix / PKG-Px / PKG-Ax / PKG-Sx / PKG-Hx / PKG-Mx
5. Execute o checklist da seção de Primitivos

### Etapa PKG-2 — Design dos Primitivos

1. Confirme que a seção **Primitivos** foi aprovada pelo humano
2. Preencha as tabelas de Design (Instructions, Prompts, Agents, Skills, Hooks, MCP)
3. Preencha o bloco `apm.yml` — **nunca tokens literais**, sempre `${VAR}`
4. Preencha a tabela de **Targets Alvo**
5. Execute o checklist da seção de Design

### Etapa PKG-3 — Executar Tasks

1. Confirme que o Design foi aprovado pelo humano
2. Execute **T-PKG-01 a T-PKG-04** na ordem — uma por vez, aguardando aprovação
3. Tasks de PKG devem referenciar IDs PKG-x do `agent-context.md`
4. Ao final, execute o **Checklist de Conformidade** do `agent-context.md`
