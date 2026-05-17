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

    MB --> SIZE{"Feature grande?<br/>+2 domínios ou<br/>+10 tasks estimadas"}

    SIZE -->|Sim| SPLIT["Dividir em sub-specs<br/>.sdd/specs/feature-componente/"]
    SIZE -->|Não| REQ

    SPLIT --> REQ

    subgraph CYCLE["Ciclo SDD — repete por feature / sub-spec"]
        REQ["📋 requirements.md<br/>REQ-x.x + OBS-x"]
        REQ --> REQ_CK{"Checklist<br/>aprovado?"}
        REQ_CK -->|Não| REQ
        REQ_CK -->|Sim| REQ_AP{"Aprovação<br/>humana"}
        REQ_AP -->|Revisão| REQ
        REQ_AP -->|Aprovado ✅| DES

        DES["🏗️ design.md<br/>APM-Mx / APM-Ex"]
        DES --> DES_CK{"Checklist<br/>aprovado?"}
        DES_CK -->|Não| DES
        DES_CK -->|Sim| DES_AP{"Aprovação<br/>humana"}
        DES_AP -->|Revisão| DES
        DES_AP -->|Aprovado ✅| TASKS

        TASKS["✅ tasks.md<br/>T-impl + T-APM-01..05"]
        TASKS --> TASKS_CK{"Checklist<br/>aprovado?"}
        TASKS_CK -->|Não| TASKS
        TASKS_CK -->|Sim| TASKS_AP{"Aprovação<br/>humana"}
        TASKS_AP -->|Revisão| TASKS
        TASKS_AP -->|Aprovado ✅| T_START
    end

    subgraph EXEC["⚙️ Execução — uma task por vez"]
        T_START([Próxima task]) --> T_CONFIRM{"Confirmação<br/>humana"}
        T_CONFIRM -->|Não| T_START
        T_CONFIRM -->|Sim| T_IMPL[Implementar]
        T_IMPL --> T_DONE{"Completo?"}
        T_DONE -->|Não| T_IMPL
        T_DONE -->|Sim| T_MARK["Marcar tasks.md ✓"]
        T_MARK --> T_AP{"Aprovação<br/>humana"}
        T_AP -->|Revisão| T_IMPL
        T_AP -->|Aprovado ✅| T_MORE{"Mais tasks?"}
        T_MORE -->|Sim| T_START
        T_MORE -->|Não| FINAL
    end

    FINAL["🏁 Checklist final<br/>APM visível + alertas"]
    FINAL --> ADR{"Decisão arquitetural<br/>a promover?"}
    ADR -->|Sim| PROMOTE["promover-adr → architecture.md"]
    ADR -->|Não| DONE([Feature concluída])
    PROMOTE --> DONE
```

---

## Memory Bank — Comandos de atualização

```mermaid
flowchart LR
    H(["Humano detecta<br/>mudança"]) --> TIPO{"Tipo de<br/>mudança"}

    TIPO -->|"Decisão técnica pós-task"| ADR["promover-adr<br/>→ architecture.md"]
    TIPO -->|"Nova visão ou segmento"| PROD["atualizar-produto<br/>→ product.md"]
    TIPO -->|"Novo padrão de observabilidade"| APM["atualizar-apm-standards<br/>→ apm-standards.md"]
    TIPO -->|"Princípio do projeto"| CONST["❌ Somente humano<br/>constitution.md é imutável para IA"]

    ADR --> DIFF["IA propõe diff"]
    PROD --> DIFF
    APM --> DIFF

    DIFF --> AP{"Aprovação<br/>humana"}
    AP -->|Revisão| DIFF
    AP -->|Aprovado ✅| SAVE[Salvo no memory bank]
```

---

## Primitivos APM disponíveis

```mermaid
flowchart LR
    subgraph AUTO["Ativação automática"]
        I1["sdd-requirements.instructions<br/>applyTo: **/requirements.md"]
        I2["sdd-design.instructions<br/>applyTo: **/design.md"]
        I3["sdd-memory-bank.instructions<br/>applyTo: .sdd/memory-bank/**"]
        I4["sdd-constitution.instructions<br/>applyTo: constitution.md"]
        SK1["skill: sdd-workflow<br/>auto-descoberta em .sdd/"]
        SK2["skill: sdd-memory-bank<br/>auto-descoberta em .sdd/memory-bank/"]
    end

    subgraph MANUAL["Invocação manual"]
        P0["/init-memory-bank"]
        P1["/criar-spec"]
        P2["/revisar-spec"]
        P3["/gerar-tasks"]
        P4["/promover-adr"]
        P5["/atualizar-produto"]
        P6["/atualizar-apm-standards"]
        AG["@sdd — agente completo"]
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
