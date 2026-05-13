# Níveis de SDD — Análise Comparativa

> Este documento detalha os três níveis do modelo SDD (Spec-Driven Development),
> seus prós, contras e quando cada um é adequado.
> **Este framework adota Spec-First.**

---

## Visão geral

| Nível | Fluxo | Quem escreve o código | Spec após entrega |
|-------|-------|-----------------------|-------------------|
| **Spec-First** | Spec → Código (humano + IA) | Humano revisa, IA implementa | Descartada (ou arquivada) |
| **Spec-Anchored** | Spec → Código (humano + IA) | Humano revisa, IA implementa | Mantida viva como artefato |
| **Spec-as-Source** | Spec → Código (IA autônoma) | IA gera sem revisão humana linha a linha | Spec **é** o código |

---

## Spec-First ← adotado por este framework

> "A spec guia a implementação e pode ser descartada após a entrega.
> O knowledge permanece no memory bank."

### Como funciona

1. Humano + IA criam `requirements.md` → aprovação humana
2. Humano + IA criam `design.md` → aprovação humana
3. IA gera `tasks.md` → humano executa e revisa task a task
4. Feature entregue → spec descartada; decisões arquiteturais promovidas para `architecture.md`

### Prós

- **Baixa dependência de consistência de docs** — a spec não precisa ser mantida após a entrega; o risco de spec desatualizada é zero
- **Foco no resultado** — toda a energia vai para o código entregue, não para manter documentação em sincronia
- **Ciclo curto** — ideal para squads ágeis com cadência de entregas frequentes
- **Onboarding de IA mais eficaz** — a spec fornece contexto denso para a IA sem exigir que ela "lembre" de trabalhos anteriores
- **Memory bank é o artefato vivo** — o que persiste (decisões, padrões, contexto de produto) é exatamente o que tem valor a longo prazo

### Contras

- **Sem rastreabilidade histórica por feature** — após o descarte, não há como rever por que uma decisão pontual foi tomada naquele sprint (mitigado pelos ADRs)
- **Overhead por feature** — criar spec completa para cada entrega tem custo; não vale para bugs pequenos
- **Requer disciplina de promoção** — se decisões arquiteturais não forem promovidas para `architecture.md` antes do descarte, o conhecimento se perde
- **Não adequado para sistemas regulados** — ambientes que exigem auditoria de decisões por feature precisam de spec permanente

### Quando usar

- Features de tamanho médio (3–8 story points)
- Times com cadência ágil (sprints curtos)
- Projetos onde o código é a fonte de verdade, não a documentação
- Quando a IA é usada como par de programação, não como executor autônomo

---

## Spec-Anchored

> "A spec é um artefato vivo: nasce antes do código e é atualizada
> toda vez que o comportamento muda."

### Como funciona

1. Spec criada antes da implementação (igual ao Spec-First)
2. Código implementado com base na spec
3. **Quando o código muda, a spec é atualizada junto**
4. A spec vive permanentemente em `docs/` ou junto ao código

### Prós

- **Rastreabilidade completa** — a spec sempre reflete o estado atual do sistema, útil para auditoria e onboarding
- **Documentação sempre válida** — elimina o problema de docs desatualizadas
- **Útil para APIs públicas ou contratos externos** — consumidores da API podem confiar na spec como fonte de verdade
- **IA tem contexto rico em qualquer momento** — não depende de memory bank; a spec está sempre acessível e atualizada

### Contras

- **Alto custo de manutenção** — cada mudança de comportamento exige atualizar a spec; em times ágeis isso cria fricção
- **Risco de spec desatualizada** — se a disciplina de atualização falhar (e falha), a spec torna-se enganosa — pior do que não ter spec
- **Duplicação de verdade** — o código e a spec descrevem a mesma coisa; qualquer divergência gera conflito
- **Não escala bem para sistemas que evoluem rápido** — o overhead de manutenção cresce com a velocidade de mudança

### Quando usar

- APIs públicas com consumidores externos (OpenAPI/AsyncAPI como spec-anchored)
- Sistemas com requisito regulatório de documentação permanente
- Componentes estáveis com baixa frequência de mudança
- Times com papéis dedicados a documentação técnica

---

## Spec-as-Source

> "A spec **é** o código. A IA lê a spec e gera a implementação completa
> sem intervenção humana linha a linha."

### Como funciona

1. Humano escreve spec de alto nível (intenção, contratos, comportamentos)
2. IA gera **todo o código** a partir da spec, de forma autônoma
3. Humano revisa o output final, não cada linha
4. Mudanças são feitas na spec, não no código diretamente

### Prós

- **Máxima velocidade de geração** — para casos bem delimitados, a IA entrega implementações completas sem interação incremental
- **Spec e código nunca divergem** — o código é derivado da spec, então por definição estão sincronizados
- **Reduz decisões de implementação pelo humano** — útil para domínios onde o "como" é padronizado e o "o quê" é o único valor humano

### Contras

- **Requer specs extremamente precisas** — ambiguidade na spec produz código incorreto sem sinal de aviso
- **Perda de controle sobre detalhes de implementação** — o humano não revisa linha a linha; bugs sutis podem passar
- **Alta dependência da capacidade da IA** — modelos atuais ainda cometem erros em lógica complexa quando operam de forma autônoma
- **Difícil de debugar** — quando o código gerado tem um bug, o humano precisa entender código que não escreveu e que pode não seguir suas convenções
- **Risco de acúmulo de débito técnico invisível** — sem revisão incremental, padrões ruins se propagam por todo o codebase gerado
- **Não adequado para sistemas críticos** — a falta de revisão humana linha a linha é inaceitável em contextos de alta criticidade

### Quando usar

- Geração de boilerplate, scaffolding, CRUDs simples
- Prototipagem rápida onde o código será reescrito
- Domínios altamente padronizados com templates bem estabelecidos
- **Não recomendado** para lógica de negócio complexa ou sistemas em produção

---

## Comparativo final

| Critério | Spec-First | Spec-Anchored | Spec-as-Source |
|----------|-----------|---------------|----------------|
| Custo de criação | Médio | Médio | Baixo |
| Custo de manutenção | **Baixo** (descarta) | Alto | Médio |
| Rastreabilidade histórica | Parcial (ADRs) | **Alta** | Baixa |
| Adequação a times ágeis | **Alta** | Média | Média |
| Controle humano sobre o código | **Alto** | Alto | Baixo |
| Risco de spec desatualizada | Zero | Alto | Zero |
| Adequação a sistemas críticos | Alta | **Alta** | Baixa |
| Dependência da qualidade da IA | Média | Média | **Alta** |

---

## Por que Spec-First foi escolhido

1. **Compatibilidade com cadência ágil** — specs de vida curta não criam overhead de manutenção
2. **Memory bank como alternativa ao spec permanente** — o conhecimento que importa a longo prazo (decisões arquiteturais, padrões, contexto de produto) fica no memory bank, que **é** mantido vivo — sem duplicação com o código
3. **Controle humano incremental** — aprovação em cada etapa (requirements → design → tasks) sem exigir revisão de cada linha de código gerado
4. **Pragmatismo** — a spec é um meio, não um fim; o valor está no software entregue e no conhecimento preservado no memory bank
