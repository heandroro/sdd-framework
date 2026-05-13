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

_Nenhum padrão emergente documentado ainda._

---

## Decisões e Aprendizados

> Registro de decisões pontuais e lições aprendidas durante o uso do framework.

| Data       | Contexto                  | Decisão / Lição                          |
|------------|---------------------------|------------------------------------------|
| [DATA]     | [PREENCHER]               | [PREENCHER]                              |

---

## FAQs para Agentes

**Q: Posso pular as tasks de Application Performance Monitor se o humano não as mencionar?**
A: Não. As tasks T-APM-xx são obrigatórias pela constitution.md.

**Q: O que fazer se requirements.md tiver detalhes técnicos?**
A: Reporte ao humano. Mova os detalhes técnicos para design.md e mantenha
   requirements.md no nível funcional.

**Q: Com que tamanho de problema devo usar o fluxo completo SDD?**
A: Problemas de tamanho médio (estimativa 3–8 pontos). Para bugs pequenos
   ou mudanças triviais, o fluxo completo é overhead desnecessário.

**Q: Como saber se um spec-first está terminado e pode ser descartado?**
A: Quando o checklist final de `tasks.md` estiver 100% marcado e o humano
   tiver aprovado a entrega. Informações arquiteturais relevantes devem ser
   promovidas para `architecture.md` antes de descartar o spec.
