# Constitution — Princípios Imutáveis

> **Este documento é imutável para agentes de IA.**
> Todo spec e toda task deve estar em conformidade com estes princípios.
> Violações detectadas durante qualquer etapa do workflow devem ser reportadas
> antes de prosseguir.

---

## 1. Princípio da Observabilidade Obrigatória

**Todo código que vai para produção deve ser instrumentado.**

- Toda nova funcionalidade DEVE definir sua telemetria na seção
  `## Application Performance Monitor / Observability Design` do `design.md`.
- Nenhuma task de implementação está completa sem a task correspondente de
  instrumentação Application Performance Monitor.
- As tasks de instrumentação Application Performance Monitor não são opcionais e não podem ser removidas
  da lista de tasks.

---

## 2. Princípio da Separação Funcional × Técnica

- O arquivo `requirements.md` deve conter **requisitos funcionais** (o QUÊ e o PORQUÊ).
- O arquivo `design.md` deve conter **decisões técnicas** (o COMO).
- Agentes de IA NÃO devem inserir detalhes de implementação em `requirements.md`.

---

## 3. Princípio do Contrato de Interface

- Toda interface exposta a outros componentes (APIs, contratos de eventos, SDKs)
  deve estar descrita no `design.md` antes da geração de código.
- Agentes de IA NÃO devem alterar contratos de interface estabelecidos sem
  explícita aprovação humana documentada no spec.

---

## 4. Princípio da Rastreabilidade

- Cada task em `tasks.md` deve referenciar pelo menos um requisito de
  `requirements.md` (ex: `[REQ-1.1]`).
- Cada task de Application Performance Monitor em `tasks.md` deve referenciar o item de telemetria
  correspondente em `design.md` (ex: `[APM-M1]`).

---

## 5. Princípio do Tamanho de Task

- Cada task deve ser implementável e revisável em uma única sessão de trabalho.
- Se uma task parecer grande demais, o agente deve propor subdivisão antes de
  iniciar a implementação.

---

## 6. Princípio da Revisão Humana

- **Requirements → Design**: Um humano DEVE revisar e aprovar `requirements.md`
  antes de iniciar `design.md`.
- **Design → Tasks**: Um humano DEVE revisar e aprovar `design.md` antes de
  gerar `tasks.md`.
- **Tasks → Código**: Cada task individual deve ser revisada antes de avançar
  para a próxima.

---

## 7. Princípio da Consistência com o Memory Bank

- O agente deve verificar que o `design.md` de cada spec está alinhado com
  `architecture.md` e `apm-standards.md` do memory bank.
- Contradições com o memory bank devem ser reportadas ao humano para resolução
  **antes** de qualquer geração de código.

---

## 8. Princípio do Commit Semântico

- Todo commit gerado ou sugerido por IA deve seguir o padrão
  [Conventional Commits](https://www.conventionalcommits.org/pt-br/).
- Prefixos obrigatórios:

  | Prefixo | Mapeia para CHANGELOG | Quando usar |
  |---------|----------------------|-------------|
  | `feat:` | `Added` | Nova feature ou comportamento |
  | `fix:` | `Fixed` | Correção de bug |
  | `chore:` | — | Manutenção sem impacto funcional (deps, build, config) |
  | `docs:` | — | Documentação apenas |
  | `refactor:` | `Changed` | Refatoração sem mudança de comportamento |
  | `perf:` | `Changed` | Melhoria de performance |
  | `test:` | — | Adição ou correção de testes |
  | `apm:` | — | Instrumentação APM (traces, métricas, alertas, dashboard) |

- Use `!` para breaking changes: `feat!: remove endpoint legado`
- O agente NÃO deve sugerir commits com mensagens genéricas como `update`, `fix stuff` ou `changes`.

---

## Checklist de Conformidade (para IA verificar em cada etapa)

```
Ao finalizar requirements.md:
  [ ] Requisitos funcionais separados de técnicos
  [ ] Seção de Observability Requirements presente
  [ ] Cada história de usuário tem critérios de aceite (GIVEN/WHEN/THEN)

Ao finalizar design.md:
  [ ] Alinhado com architecture.md
  [ ] Alinhado com apm-standards.md
  [ ] Seção Application Performance Monitor / Observability Design completa com métricas, eventos, SLOs
  [ ] Contratos de interface definidos

Ao finalizar tasks.md:
  [ ] Toda task referencia pelo menos um REQ-x.x
  [ ] Tasks de Application Performance Monitor presentes e referenciam itens APM-xx do design.md
  [ ] Nenhuma task é excessivamente grande
```
