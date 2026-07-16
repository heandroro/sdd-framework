# LLM-CONTEXT.md — Contexto, Harnesses e a Context Window

> Como os modelos de linguagem (LLMs) agregam contexto em cada request,
> como o SDD Framework se integra com diferentes harnesses de IDE,
> e por que o design do framework minimiza os riscos inerentes à context window.

---

## Como a LLM agrega contexto em cada request

Toda chamada a uma LLM é **stateless**. O modelo não tem memória entre sessões — tudo
que ele "sabe" sobre o projeto precisa ser enviado no mesmo request, dentro de uma
estrutura chamada **context window**.

```
┌─────────────────────────────────────────────────────┐
│                   CONTEXT WINDOW                    │
│                                                     │
│  [system prompt]   ← AGENTS.md + memory bank       │
│  [tool outputs]    ← resultados de leitura de arq. │
│  [histórico]       ← mensagens anteriores da sess. │
│  [arquivos abertos]← editor context                │
│  [pergunta atual]  ← sua mensagem                  │
└─────────────────────────────────────────────────────┘
                          ↓
                   modelo processa TUDO
                   de uma vez só
```

O tamanho é medido em **tokens** (≈ 0,75 palavras por token). Referência dos modelos atuais:

| Modelo | Context window |
|---|---|
| Claude Sonnet 4.x | 200k tokens |
| GPT-4o | 128k tokens |
| Gemini 1.5 Pro | 1M tokens |

---

## Ganhos com contexto bem estruturado

- **Coerência**: o modelo mantém decisões consistentes com `architecture.md` e `constitution.md`
  sem precisar ser lembrado a cada mensagem.
- **Rastreabilidade**: consegue referenciar REQ-x.x e APM-Mx diretamente porque os specs
  estão na janela.
- **Menos alucinação**: com contexto real, o modelo inventa menos — âncora em fatos concretos
  do projeto.
- **Redução de idas e vindas**: uma pergunta complexa é respondida corretamente na primeira vez,
  sem ciclos de correção.

---

## Riscos com excesso de contexto

### 1. Degradação de atenção (*lost in the middle*)

Pesquisas mostram que modelos prestam mais atenção ao **início e fim** da context window.
Informação crítica posicionada no meio pode ser ignorada ou ter peso menor.

```
[início — alta atenção]
  constitution.md
  architecture.md          ← risco: ignorado se a janela for grande demais
  arquivos do projeto
[fim — alta atenção]
  sua pergunta
```

### 2. Custo e latência

Cada token processado tem custo computacional. Uma janela de 150k tokens custa
aproximadamente 10× mais e é ~3× mais lenta do que uma de 10k tokens.

### 3. Contaminação de contexto

Arquivos irrelevantes ou desatualizados no contexto podem **confundir** o modelo —
ele tenta reconciliar informações contraditórias e pode tomar decisões erradas,
priorizando um trecho em detrimento de outro sem clareza de qual é o mais recente.

### 4. Limite de janela (*context overflow*)

Quando o conteúdo ultrapassa o limite do modelo, o harness **trunca silenciosamente** —
geralmente cortando o meio ou o início do contexto. O modelo não avisa que perdeu informação.

---

## Como o SDD Framework mitiga esses riscos

O design do framework já endereça esses riscos estruturalmente:

| Risco | Mitigação no framework |
|---|---|
| Contexto irrelevante | Memory bank tem 4 arquivos focados — não um monolito de documentação |
| Contexto desatualizado | Specs são descartadas após entrega; conhecimento relevante é promovido para o memory bank |
| Lost in the middle | `AGENTS.md` instrui leitura na ordem de prioridade (`constitution.md` primeiro) |
| Context overflow | Specs por feature em pastas separadas — carregadas sob demanda, não todas de uma vez |
| Contaminação por specs antigas | Spec-first: ciclo de vida curto e descarte explícito no checklist de `tasks.md` |

---

## Integração com harnesses de IDE

O termo **harness** refere-se ao mecanismo que cada IDE ou ambiente de IA usa para
injetar contexto no modelo automaticamente — sem que o usuário precise copiar e colar.

O `AGENTS.md` na raiz **é** o ponto de integração do framework com o harness ativo.
Cada IDE tem um arquivo equivalente que ela detecta e injeta no system prompt:

| IDE / Ambiente | Arquivo lido automaticamente |
|---|---|
| **VS Code Copilot** | `AGENTS.md`, `.github/copilot-instructions.md`, `.instructions.md` |
| **Cursor** | `.cursorrules` |
| **Windsurf** | `.windsurfrules` |
| **Kiro (AWS)** | `.kiro/steering/*.md` |
| **Claude Projects** | Arquivos fixados no Project |
| **OpenAI / Gemini (API direta)** | Não há harness — requer injeção manual no system prompt |

### Como o AGENTS.md se conecta ao .sdd/

O `AGENTS.md` não inclui tecnicamente os arquivos do memory bank — ele instrui o agente
a lê-los como **primeira ação da sessão**:

```
AGENTS.md  →  instrução de leitura  →  .sdd/memory-bank/constitution.md
                                    →  .sdd/memory-bank/architecture.md
                                    →  .sdd/memory-bank/product.md
                                    →  .sdd/memory-bank/apm-standards.md
```

É uma referência por instrução comportamental, não um `include` técnico.
O harness injeta o `AGENTS.md` no system prompt; o agente, ao seguir as instruções,
lê os arquivos `.sdd/` e os adiciona à context window da sessão.

### Suportando múltiplos harnesses

O conteúdo do memory bank é **Markdown puro — agnóstico de modelo**. Para suportar
um harness diferente do VS Code Copilot, basta criar o arquivo equivalente na raiz
apontando para o mesmo conteúdo:

```markdown
# .cursorrules
Siga as instruções definidas em AGENTS.md e leia o memory bank em .sdd/memory-bank/
antes de qualquer ação.
```

Para **API direta** (sem harness de IDE), o system prompt precisa ser construído
programaticamente, serializando o conteúdo do memory bank no formato esperado pelo provider:

```
Claude API  →  <system> + documentos no turn do usuário
Gemini API  →  systemInstruction + contexto no prompt
OpenAI API  →  system message + arquivos anexados
```

Isso está fora do escopo do framework de arquivos — seria responsabilidade de um
script ou do ciclo APM CLI em um target específico.

---

## Regra prática

> Carregue no contexto apenas o que é necessário para a **sessão atual**.
> O memory bank é sempre carregado. Specs de outras features, não.
> Quanto mais focado o contexto, mais precisa e econômica é a resposta do modelo.
