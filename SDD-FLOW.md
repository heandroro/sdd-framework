# SDD Flow

Fluxo completo do ciclo Spec-Driven Development, do início de uma sessão até a conclusão de uma feature.

---

## Visão Geral

```mermaid
flowchart TD
    SESSION([Início de sessão]) --> MB

    subgraph MB["📚 Memory Bank — leitura obrigatória"]
        MB1[constitution.md] --> MB2[architecture.md] --> MB3[product.md] --> MB4[apm-standards.md]
    end

    MB --> SIZE{Feature grande?\n+2 domínios ou\n+10 tasks estimadas}

    SIZE -->|Sim| SPLIT[Dividir em sub-specs\n.sdd/specs/feature-componente/]
    SIZE -->|Não| REQ

    SPLIT --> REQ

    subgraph CYCLE["Ciclo SDD — repete por feature / sub-spec"]
        REQ[📋 requirements.md\nREQ-x.x + OBS-x]
        REQ --> REQ_CK{Checklist\naprovado?}
        REQ_CK -->|Não| REQ
        REQ_CK -->|Sim| REQ_AP{Aprovação\nhumana}
        REQ_AP -->|Revisão| REQ
        REQ_AP -->|Aprovado ✅| DES

        DES[🏗️ design.md\nAPM-Mx / APM-Ex]
        DES --> DES_CK{Checklist\naprovado?}
        DES_CK -->|Não| DES
        DES_CK -->|Sim| DES_AP{Aprovação\nhumana}
        DES_AP -->|Revisão| DES
        DES_AP -->|Aprovado ✅| TASKS

        TASKS[✅ tasks.md\nT-impl + T-APM-01..05]
        TASKS --> TASKS_CK{Checklist\naprovado?}
        TASKS_CK -->|Não| TASKS
        TASKS_CK -->|Sim| TASKS_AP{Aprovação\nhumana}
        TASKS_AP -->|Revisão| TASKS
        TASKS_AP -->|Aprovado ✅| EXEC
    end

    subgraph EXEC["⚙️ Execução — uma task por vez"]
        T_START([Próxima task]) --> T_CONFIRM{Confirmação\nhumana}
        T_CONFIRM -->|Não| T_START
        T_CONFIRM -->|Sim| T_IMPL[Implementar]
        T_IMPL --> T_DONE{Completo?}
        T_DONE -->|Não| T_IMPL
        T_DONE -->|Sim| T_MARK[Marcar tasks.md ✓]
        T_MARK --> T_AP{Aprovação\nhumana}
        T_AP -->|Revisão| T_IMPL
        T_AP -->|Aprovado ✅| T_MORE{Mais tasks?}
        T_MORE -->|Sim| T_START
        T_MORE -->|Não| FINAL
    end

    FINAL[🏁 Checklist final\nAPM visível + alertas]
    FINAL --> ADR{Decisão arquitetural\na promover?}
    ADR -->|Sim| PROMOTE[/promover-adr\n→ architecture.md]
    ADR -->|Não| DONE([Feature concluída])
    PROMOTE --> DONE
```

---

## Memory Bank — Comandos de atualização

```mermaid
flowchart LR
    H([Humano detecta\nmudança]) --> TIPO{Tipo de\nmudança}

    TIPO -->|Decisão técnica\npós-task| ADR[/promover-adr\n→ architecture.md]
    TIPO -->|Nova visão\nou segmento| PROD[/atualizar-produto\n→ product.md]
    TIPO -->|Novo padrão\nde observabilidade| APM[/atualizar-apm-standards\n→ apm-standards.md]
    TIPO -->|Princípio\ndo projeto| CONST[❌ Somente humano\nconstituion.md é imutável para IA]

    ADR --> DIFF[IA propõe diff]
    PROD --> DIFF
    APM --> DIFF

    DIFF --> AP{Aprovação\nhumana}
    AP -->|Revisão| DIFF
    AP -->|Aprovado ✅| SAVE[Salvo no memory bank]
```

---

## Primitivos APM disponíveis

```mermaid
flowchart LR
    subgraph AUTO["Ativação automática"]
        I1[sdd-requirements.instructions\napplyTo: **/requirements.md]
        I2[sdd-design.instructions\napplyTo: **/design.md]
        I3[sdd-memory-bank.instructions\napplyTo: .sdd/memory-bank/**]
        I4[sdd-constitution.instructions\napplyTo: constitution.md]
        SK1[skill: sdd-workflow\nauto-descoberta em .sdd/]
        SK2[skill: sdd-memory-bank\nauto-descoberta em .sdd/memory-bank/]
    end

    subgraph MANUAL["Invocação manual"]
        P1[/criar-spec]
        P2[/revisar-spec]
        P3[/gerar-tasks]
        P4[/promover-adr]
        P5[/atualizar-produto]
        P6[/atualizar-apm-standards]
        AG[@sdd — agente completo]
    end
```

---

## Rastreabilidade

Cada artefato produzido no ciclo mantém rastreabilidade vertical:

```
OBS-x  (requirements.md)
  └── APM-Mx / APM-Ex  (design.md)
        └── T-APM-01..05  (tasks.md)
              └── telemetria instrumentada no código

REQ-x.x  (requirements.md)
  └── decisão de design  (design.md)
        └── T-x  (tasks.md)  [REQ-x.x]
              └── código implementado
```
