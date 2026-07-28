import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildInternalFailureEvent,
  buildMetrics,
  buildValidationErrorEvents,
  buildValidationRunEvent,
  detectSource,
  emitTelemetry,
} from "../src/telemetry";
import type { ValidationReport } from "../src/types";

function buildReport(): ValidationReport {
  return {
    summary: { specsScanned: 2, filesScanned: 5, errors: 3, warnings: 1, durationMs: 42 },
    results: [
      {
        spec: ".sdd/specs/a",
        findings: [
          { ruleId: "R008", severity: "error", file: "a/tasks.md", message: "m1" },
          { ruleId: "R008", severity: "error", file: "a/tasks.md", message: "m2" },
          { ruleId: "R002", severity: "warning", file: "a/requirements.md", message: "m3" },
        ],
      },
      {
        spec: ".sdd/specs/b",
        findings: [{ ruleId: "R005", severity: "error", file: "b/design.md", message: "m4" }],
      },
    ],
  };
}

test("detectSource: SDD_CALLER=agent -> 'agent'; ausente ou qualquer outro valor -> 'human'", () => {
  assert.equal(detectSource({ SDD_CALLER: "agent" }), "agent");
  assert.equal(detectSource({}), "human");
  assert.equal(detectSource({ SDD_CALLER: "algumacoisa" }), "human");
});

test("buildMetrics: APM-M1..M5 refletem o summary e agregam erros por regra (só severity=error)", () => {
  const metrics = buildMetrics(buildReport());

  assert.equal(metrics["sdd.validator.specs_scanned.count"], 2);
  assert.equal(metrics["sdd.validator.errors.count"], 3);
  assert.equal(metrics["sdd.validator.warnings.count"], 1);
  assert.equal(metrics["sdd.validator.duration.ms"], 42);
  assert.deepEqual(metrics["sdd.validator.errors_by_rule.count"], { R008: 2, R005: 1 });
});

test("buildValidationRunEvent (APM-E1): inclui summary, format, strict e source", () => {
  const event = buildValidationRunEvent(buildReport(), { format: "json", strict: true, source: "agent" });

  assert.deepEqual(event, {
    event: "ValidationRun",
    specsScanned: 2,
    filesScanned: 5,
    errors: 3,
    warnings: 1,
    durationMs: 42,
    format: "json",
    strict: true,
    source: "agent",
  });
});

test("buildValidationErrorEvents (APM-E2): um evento por regra com ≥1 erro, por spec, com occurrences correto", () => {
  const events = buildValidationErrorEvents(buildReport());

  assert.deepEqual(events, [
    { event: "ValidationError", ruleId: "R008", specPath: ".sdd/specs/a", severity: "error", occurrences: 2 },
    { event: "ValidationError", ruleId: "R005", specPath: ".sdd/specs/b", severity: "error", occurrences: 1 },
  ]);
});

test("buildValidationErrorEvents: warnings não geram ValidationError (só severity=error)", () => {
  const report: ValidationReport = {
    summary: { specsScanned: 1, filesScanned: 1, errors: 0, warnings: 1, durationMs: 1 },
    results: [
      { spec: ".sdd/specs/a", findings: [{ ruleId: "R002", severity: "warning", file: "a.md", message: "m" }] },
    ],
  };

  assert.deepEqual(buildValidationErrorEvents(report), []);
});

test("buildInternalFailureEvent (APM-E3, OBS-5): nunca inclui caminho ou conteúdo de spec, só errorCode/component/message", () => {
  const event = buildInternalFailureEvent(new Error("falha ao ler .sdd/specs/segredo/requirements.md"), "cli.main");

  assert.equal(event.event, "InternalFailure");
  assert.equal(event.component, "cli.main");
  assert.equal(typeof event.errorCode, "string");
  assert.deepEqual(Object.keys(event).sort(), ["component", "errorCode", "event", "message"]);
});

test("buildInternalFailureEvent: erros não-Error (ex: string lançada) também são tratados", () => {
  const event = buildInternalFailureEvent("string lançada diretamente", "parser");
  assert.equal(event.message, "string lançada diretamente");
});

test("emitTelemetry: escreve cada evento como uma linha JSON prefixada em stderr, nunca em stdout", () => {
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  let stdout = "";
  let stderr = "";
  process.stdout.write = ((chunk: string) => {
    stdout += chunk;
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string) => {
    stderr += chunk;
    return true;
  }) as typeof process.stderr.write;

  try {
    emitTelemetry([
      { event: "ValidationRun", specsScanned: 1, filesScanned: 1, errors: 0, warnings: 0, durationMs: 1, format: "text", strict: false, source: "human" },
      { event: "InternalFailure", errorCode: "E_INTERNAL", component: "x", message: "y" },
    ]);
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }

  assert.equal(stdout, "");
  const lines = stderr.trim().split("\n");
  assert.equal(lines.length, 2);
  for (const line of lines) {
    assert.match(line, /^\[telemetry\] /);
    assert.doesNotThrow(() => JSON.parse(line.replace("[telemetry] ", "")));
  }
});
