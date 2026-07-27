import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSpec } from "../../src/parser";
import {
  r005ApmSectionPresent,
  r006ObsHasApmCoverage,
  r007UniqueApmIds,
} from "../../src/rules/design";
import type { SpecContext } from "../../src/types";

const REQUIREMENTS_WITH_TWO_OBS = [
  "## Requisitos de Observabilidade (Application Performance Monitor)",
  "- [ ] **[OBS-1]** métrica de operação",
  "- [ ] **[OBS-2]** kpi de produto",
].join("\n");

function buildDesignWithFullCoverage(): string {
  return [
    "# Design",
    "",
    "## Application Performance Monitor / Observability Design",
    "",
    "### Métricas",
    "",
    "| ID | Nome | Tipo | OBS |",
    "|----|------|------|-----|",
    "| APM-M1 | sdd.validator.specs_scanned.count | Counter | OBS-1 |",
    "| APM-M2 | sdd.validator.errors.count | Counter | OBS-2 |",
  ].join("\n");
}

test("R005: aceita heading que contém 'Application Performance Monitor' como substring (não precisa ser exato)", () => {
  const spec = parseSpec("design.md", "design", buildDesignWithFullCoverage());
  assert.deepEqual(r005ApmSectionPresent.check(spec, {}), []);
});

test("R005: aceita heading literal '## APM'", () => {
  const spec = parseSpec("design.md", "design", "## APM\n\nconteúdo\n");
  assert.deepEqual(r005ApmSectionPresent.check(spec, {}), []);
});

test("R005: reporta erro quando nenhum heading menciona APM", () => {
  const spec = parseSpec("design.md", "design", "## Resumo\n\nsem seção de observabilidade\n");
  const findings = r005ApmSectionPresent.check(spec, {});
  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, "R005");
  assert.equal(findings[0].severity, "error");
});

test("R006: sem requirements.md irmão, degrada graciosamente para warning (não error)", () => {
  const spec = parseSpec("design.md", "design", buildDesignWithFullCoverage());
  const findings = r006ObsHasApmCoverage.check(spec, {});
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, "warning");
  assert.match(findings[0].message, /requirements\.md correspondente não encontrado/);
});

test("R006: todos os OBS-x cobertos por APM-Mx na mesma linha não reporta nada", () => {
  const requirements = parseSpec("requirements.md", "requirements", REQUIREMENTS_WITH_TWO_OBS);
  const design = parseSpec("design.md", "design", buildDesignWithFullCoverage());
  const context: SpecContext = { requirements };

  assert.deepEqual(r006ObsHasApmCoverage.check(design, context), []);
});

test("R006: reporta erro listando os OBS-x sem cobertura APM", () => {
  const requirements = parseSpec("requirements.md", "requirements", REQUIREMENTS_WITH_TWO_OBS);
  const designMissingObs2 = buildDesignWithFullCoverage().replace(
    "| APM-M2 | sdd.validator.errors.count | Counter | OBS-2 |",
    "",
  );
  const design = parseSpec("design.md", "design", designMissingObs2);
  const context: SpecContext = { requirements };

  const findings = r006ObsHasApmCoverage.check(design, context);

  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, "error");
  assert.match(findings[0].message, /OBS-2/);
  assert.doesNotMatch(findings[0].message, /OBS-1(?!\d)/);
});

test("R007: reporta erro quando um ID APM-Mx/APM-Ex aparece duplicado", () => {
  const content = [
    "| APM-M1 | métrica A |",
    "| APM-E1 | evento A |",
    "| APM-M1 | métrica duplicada |",
  ].join("\n");
  const spec = parseSpec("design.md", "design", content);

  const findings = r007UniqueApmIds.check(spec, {});

  assert.equal(findings.length, 1);
  assert.equal(findings[0].ruleId, "R007");
  assert.match(findings[0].message, /APM-M1/);
  assert.match(findings[0].message, /1, 3/);
});

test("R007: IDs APM-Mx/APM-Ex todos únicos não reporta nada", () => {
  const spec = parseSpec("design.md", "design", buildDesignWithFullCoverage());
  assert.deepEqual(r007UniqueApmIds.check(spec, {}), []);
});
