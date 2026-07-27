import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSpec } from "../../src/parser";
import {
  r001ObservabilitySubsectionsFilled,
  r002NoPlaceholders,
  r003UniqueReqIds,
  r004AtLeastOneReq,
} from "../../src/rules/requirements";
import type { SpecContext } from "../../src/types";

const EMPTY_CONTEXT: SpecContext = {};

function buildValidRequirements(): string {
  return [
    "# Requirements — Demo",
    "",
    "## Histórias de Usuário",
    "",
    "### História 1",
    "",
    "| ID | Cenário |",
    "|----|---------|",
    "| REQ-1.1 | dado quando então |",
    "",
    "## Requisitos de Observabilidade (Application Performance Monitor)",
    "",
    "### O que precisa ser visível para o time de operações?",
    "",
    "- [ ] **[OBS-1]** métrica de operação",
    "",
    "### O que precisa ser visível para o time de produto/negócio?",
    "",
    "- [ ] **[OBS-2]** kpi de produto",
    "",
    "### Quais falhas precisam gerar alertas imediatos?",
    "",
    "- [ ] **[OBS-3]** alerta crítico",
    "",
    "## O que está fora do escopo",
    "",
    "- nada",
  ].join("\n");
}

test("requirements válido: R001-R004 não reportam nada", () => {
  const spec = parseSpec("requirements.md", "requirements", buildValidRequirements());

  assert.deepEqual(r001ObservabilitySubsectionsFilled.check(spec, EMPTY_CONTEXT), []);
  assert.deepEqual(r002NoPlaceholders.check(spec, EMPTY_CONTEXT), []);
  assert.deepEqual(r003UniqueReqIds.check(spec, EMPTY_CONTEXT), []);
  assert.deepEqual(r004AtLeastOneReq.check(spec, EMPTY_CONTEXT), []);
});

test("R001: reporta erro quando uma subseção de observabilidade está totalmente ausente", () => {
  const withoutOneSubsection = buildValidRequirements().replace(
    /### Quais falhas precisam gerar alertas imediatos\?\n\n- \[ \] \*\*\[OBS-3\]\*\* alerta crítico\n\n/,
    "",
  );
  const spec = parseSpec("requirements.md", "requirements", withoutOneSubsection);

  const findings = r001ObservabilitySubsectionsFilled.check(spec, EMPTY_CONTEXT);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, "R001");
  assert.equal(findings[0].severity, "error");
  assert.match(findings[0].message, /Quais falhas precisam gerar alertas imediatos\?/);
});

test("R001: reporta erro quando a subseção existe mas não tem nenhum OBS-x", () => {
  const emptySubsection = buildValidRequirements().replace(
    "- [ ] **[OBS-3]** alerta crítico\n\n",
    "",
  );
  const spec = parseSpec("requirements.md", "requirements", emptySubsection);

  const findings = r001ObservabilitySubsectionsFilled.check(spec, EMPTY_CONTEXT);

  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /não contém nenhum item \[OBS-x\]/);
});

test("R002: reporta um warning por ocorrência de [PREENCHER], com a linha certa", () => {
  const content = "## Fora do escopo\n\n- [PREENCHER]\n- Outra linha\n- [PREENCHER]\n";
  const spec = parseSpec("requirements.md", "requirements", content);

  const findings = r002NoPlaceholders.check(spec, EMPTY_CONTEXT);

  assert.equal(findings.length, 2);
  assert.deepEqual(findings.map((f) => f.line), [3, 5]);
  assert.ok(findings.every((f) => f.severity === "warning"));
});

test("R003: reporta erro listando as linhas de IDs REQ-x.x duplicados (declarados em tabela)", () => {
  const content = [
    "| REQ-1.1 | primeira |",
    "| REQ-1.2 | outro |",
    "| REQ-1.1 | duplicada |",
  ].join("\n");
  const spec = parseSpec("requirements.md", "requirements", content);

  const findings = r003UniqueReqIds.check(spec, EMPTY_CONTEXT);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, "R003");
  assert.match(findings[0].message, /REQ-1\.1/);
  assert.match(findings[0].message, /1, 3/);
});

test("R003: não conta menções em prosa (fora de tabela) como declarações duplicadas", () => {
  const content = [
    "| REQ-1.1 | descrição real |",
    "| REQ-1.3 | duplicados (ex: dois `REQ-1.1`) |",
    "Veja também REQ-1.1 no texto acima, sem ser uma nova declaração.",
  ].join("\n");
  const spec = parseSpec("requirements.md", "requirements", content);

  assert.deepEqual(r003UniqueReqIds.check(spec, EMPTY_CONTEXT), []);
});

test("R004: reporta erro quando não há nenhum REQ-x.x no arquivo", () => {
  const spec = parseSpec("requirements.md", "requirements", "## Contexto\n\nsem requisitos aqui\n");

  const findings = r004AtLeastOneReq.check(spec, EMPTY_CONTEXT);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, "R004");
  assert.equal(findings[0].severity, "error");
});
