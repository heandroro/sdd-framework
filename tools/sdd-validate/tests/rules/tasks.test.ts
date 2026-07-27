import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSpec } from "../../src/parser";
import { r008RequiredApmTasksPresent, r009ImplementationTasksTraceToReq } from "../../src/rules/tasks";

function buildTasks(rows: string[]): string {
  return [
    "| ID | Task | Tipo | Refs | Status |",
    "|----|------|------|------|--------|",
    ...rows,
  ].join("\n");
}

test("R008: todas as T-APM-01..05 presentes não reporta nada", () => {
  const content = buildTasks([
    "| T-APM-01 | Traces | APM | design.md | `[ ]` |",
    "| T-APM-02 | Métricas | APM | APM-M1 | `[ ]` |",
    "| T-APM-03 | Eventos | APM | APM-E1 | `[ ]` |",
    "| T-APM-04 | Alertas | APM | ALT-01 | `[ ]` |",
    "| T-APM-05 | Dashboard | APM | design.md | `[ ]` |",
  ]);
  const spec = parseSpec("tasks.md", "tasks", content);

  assert.deepEqual(r008RequiredApmTasksPresent.check(spec, {}), []);
});

test("R008: reporta uma Finding por task T-APM ausente (individualmente)", () => {
  const content = buildTasks([
    "| T-APM-01 | Traces | APM | design.md | `[ ]` |",
    "| T-APM-02 | Métricas | APM | APM-M1 | `[ ]` |",
  ]);
  const spec = parseSpec("tasks.md", "tasks", content);

  const findings = r008RequiredApmTasksPresent.check(spec, {});

  assert.equal(findings.length, 3);
  assert.deepEqual(
    findings.map((f) => f.message),
    [
      "Task obrigatória ausente: T-APM-03",
      "Task obrigatória ausente: T-APM-04",
      "Task obrigatória ausente: T-APM-05",
    ],
  );
  assert.ok(findings.every((f) => f.ruleId === "R008" && f.severity === "error"));
});

test("R009: task T-IMP com REQ-x.x na mesma linha não é sinalizada", () => {
  const content = buildTasks(["| T-IMP-01 | Scaffold | Implementação | REQ-1.4, REQ NFR Portabilidade | `[ ]` |"]);
  const spec = parseSpec("tasks.md", "tasks", content);

  assert.deepEqual(r009ImplementationTasksTraceToReq.check(spec, {}), []);
});

test("R009: task T-IMP sem nenhum REQ-x.x é listada no warning", () => {
  const content = buildTasks([
    "| T-IMP-01 | Scaffold | Implementação | REQ-1.4 | `[ ]` |",
    "| T-IMP-02 | Parser | Implementação | (sem referência clara) | `[ ]` |",
  ]);
  const spec = parseSpec("tasks.md", "tasks", content);

  const findings = r009ImplementationTasksTraceToReq.check(spec, {});

  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, "warning");
  assert.match(findings[0].message, /T-IMP-02/);
  assert.doesNotMatch(findings[0].message, /T-IMP-01(?!\d)/);
});

test("R009: T-APM-xx e T-DOC-xx nunca são sinalizadas, mesmo sem REQ-x.x", () => {
  const content = buildTasks([
    "| T-APM-01 | Traces | APM | design.md | `[ ]` |",
    "| T-DOC-01 | Docs | Documentação | — | `[ ]` |",
  ]);
  const spec = parseSpec("tasks.md", "tasks", content);

  assert.deepEqual(r009ImplementationTasksTraceToReq.check(spec, {}), []);
});
