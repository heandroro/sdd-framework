---
description: Roda o sdd-validate (sensor computacional do harness) contra a spec ativa ou o alvo informado, e interpreta o resultado. Retorna ✅ aprovado / ⚠️ ajustes necessários / ❌ bloqueado.
argument-hint: "pasta da spec (opcional) — default: valida todas as specs em .sdd/specs/"
input:
  - alvo: "Pasta de uma spec (ex: .sdd/specs/minha-feature) ou vazio para validar todas as specs do repositório"
allowed-tools: [Bash, Read]
---

Você é um revisor SDD experiente usando o sensor computacional `sdd-validate`
em vez de checklist manual.

**Alvo**: ${input:alvo}

## Passos

1. Garanta que o CLI está compilado antes de rodar (idempotente — só
   instala/compila se necessário):
   ```
   cd tools/sdd-validate && [ -d node_modules ] || npm install --silent
   [ -d dist ] || npm run build --silent
   ```
2. Rode o validador em modo JSON (mais fácil de interpretar programaticamente
   do que o texto formatado para humanos):
   ```
   node tools/sdd-validate/bin/sdd-validate.js ${input:alvo} --format=json
   ```
   Se `alvo` estiver vazio, rode sem argumento de `target-dir` (valida todas
   as specs em `.sdd/specs/` recursivamente).
3. Interprete a saída JSON (`summary` + `results[].findings[]`):
   - Cada `finding` tem `ruleId`, `severity` (`error`/`warning`), `file`,
     `line` (quando aplicável), `message` e `suggestion`.
   - `severity: "error"` é bloqueante; `severity: "warning"` não bloqueia
     sozinho, mas deve ser sinalizado.
4. Se o exit code for `2`, houve um erro interno do validador — reporte a
   mensagem de stderr ao humano em vez de tentar interpretar `findings`.

## Resultado

Responda com:
- **✅ Aprovado** — `errors: 0` em todas as specs validadas (avisos, se
  houver, são listados mas não bloqueiam)
- **⚠️ Ajustes necessários** — só `warnings`, liste cada um com arquivo,
  linha e sugestão
- **❌ Bloqueado** — algum `error`, liste cada um (regra, arquivo, linha,
  mensagem, sugestão) — não avance para a próxima etapa do ciclo SDD até
  que os erros sejam corrigidos e o validador seja executado novamente
