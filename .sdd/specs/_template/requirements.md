# Requirements — [Nome da Feature]

> **Spec-first**: Este documento é criado antes do código e descartado após
> a entrega. É a fonte de verdade funcional para humanos e agentes de IA.
>
> **Instrução para IA**: Preencha as seções marcadas com `[IA]` com base no
> contexto fornecido pelo humano. Não insira decisões técnicas aqui —
> isso pertence ao `design.md`. Ao finalizar, verifique o checklist no final.

---

## Contexto da Feature

> Descreva em 2-4 frases o contexto e a motivação para esta feature.
> Por que ela está sendo construída agora?

**[HUMANO preenche — IA pode sugerir com base no contexto]**

---

## Histórias de Usuário `[IA]`

> Cada história deve ser pequena o suficiente para ser implementada em uma
> sessão de trabalho focada. Quebre histórias grandes em menores.

### História 1 — [Nome curto]

**Como** [persona],
**quero** [ação/capacidade],
**para que** [benefício/valor de negócio].

**Critérios de Aceite**

| ID       | Cenário (GIVEN / WHEN / THEN)                                              |
|----------|----------------------------------------------------------------------------|
| REQ-1.1  | **DADO** [pré-condição] **QUANDO** [ação] **ENTÃO** [resultado esperado]   |
| REQ-1.2  | **DADO** [...] **QUANDO** [...] **ENTÃO** [...]                            |

---

### História 2 — [Nome curto]

**Como** [persona],
**quero** [ação/capacidade],
**para que** [benefício/valor de negócio].

**Critérios de Aceite**

| ID       | Cenário (GIVEN / WHEN / THEN)                                              |
|----------|----------------------------------------------------------------------------|
| REQ-2.1  | **DADO** [pré-condição] **QUANDO** [ação] **ENTÃO** [resultado esperado]   |
| REQ-2.2  | **DADO** [...] **QUANDO** [...] **ENTÃO** [...]                            |

---

## Requisitos de Observabilidade (Application Performance Monitor) `[IA]`

> Defina aqui **o que** deve ser observável, não **como** implementar.
> O design da instrumentação fica em `design.md`.

### O que precisa ser visível para o time de operações?

- [ ] **[OBS-1]** [Descreva o comportamento operacional que precisa ser monitorável]
  - _Exemplo: "Precisa ser possível saber quantos pedidos são criados por minuto"_
- [ ] **[OBS-2]** [...]

### O que precisa ser visível para o time de produto/negócio?

- [ ] **[OBS-3]** [Descreva o KPI de negócio que esta feature impacta]
  - _Exemplo: "Precisa ser possível medir a taxa de conversão do novo fluxo de checkout"_
- [ ] **[OBS-4]** [...]

### Quais falhas precisam gerar alertas imediatos?

- [ ] **[OBS-5]** [Descreva a condição de falha crítica]
  - _Exemplo: "Se o serviço de pagamento ficar indisponível > 1 min, alerta crítico"_
- [ ] **[OBS-6]** [...]

---

## Requisitos Não-Funcionais

| Categoria        | Requisito                                          | Prioridade   |
|------------------|----------------------------------------------------|--------------|
| Performance      | [PREENCHER — ex: p95 < 300ms]                      | Alta         |
| Disponibilidade  | [PREENCHER — ex: 99.9% uptime]                     | Alta         |
| Segurança        | [PREENCHER — ex: autenticado via Azure AD]         | Alta         |
| Escalabilidade   | [PREENCHER — ex: suportar 1000 req/s]              | Média        |

---

## O que está fora do escopo

> Seja explícito sobre o que NÃO será feito nesta feature.

- [PREENCHER]

---

## Dependências e Pré-condições

> O que precisa existir ou estar pronto para esta feature funcionar?

- [PREENCHER]

---

## Checklist de Conformidade (IA verifica antes de finalizar)

```
[ ] Requisitos são funcionais — sem detalhes de implementação técnica
[ ] Toda história tem critérios de aceite no formato GIVEN/WHEN/THEN
[ ] IDs de requisito são únicos e sequenciais (REQ-x.x)
[ ] Seção de Observability Requirements preenchida (mínimo 1 item por subseção)
[ ] IDs de observabilidade são únicos (OBS-x)
[ ] Seção "Fora do escopo" preenchida
[ ] Alinhado com product.md (personas e KPIs de negócio)
```
