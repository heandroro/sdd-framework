import assert from "node:assert/strict";
import { test } from "node:test";
import { formatJson, formatText } from "../src/reporter";
import type { ValidationReport } from "../src/types";

function buildReport(): ValidationReport {
  return {
    summary: { specsScanned: 1, filesScanned: 2, errors: 1, warnings: 1, durationMs: 42 },
    results: [
      {
        spec: ".sdd/specs/minha-feature",
        findings: [
          {
            ruleId: "R008",
            severity: "error",
            file: "tasks.md",
            line: 34,
            message: "Task T-APM-04 ausente",
            suggestion: "Adicione a task T-APM-04.",
          },
          {
            ruleId: "R002",
            severity: "warning",
            file: "requirements.md",
            line: 12,
            message: "Placeholder [PREENCHER] não substituído",
          },
        ],
      },
    ],
  };
}

test("formatText: agrupa por arquivo, prefixa [ERROR]/[WARN], inclui linha e sugestão", () => {
  const output = formatText(buildReport());

  assert.match(output, /^\.sdd\/specs\/minha-feature:/m);
  assert.match(output, /\[ERROR\] tasks\.md:34 · R008 — Task T-APM-04 ausente/);
  assert.match(output, /Sugestão: Adicione a task T-APM-04\./);
  assert.match(output, /\[WARN\] requirements\.md:12 · R002 — Placeholder \[PREENCHER\] não substituído/);
  assert.match(output, /1 spec\(s\) · 2 arquivo\(s\) · 1 erro\(s\) · 1 aviso\(s\) · 42ms/);
});

test("formatText: sem findings, ainda mostra a linha de resumo", () => {
  const report: ValidationReport = {
    summary: { specsScanned: 0, filesScanned: 0, errors: 0, warnings: 0, durationMs: 5 },
    results: [],
  };

  const output = formatText(report);

  assert.match(output, /Nenhum spec encontrado ou nenhum finding gerado\./);
  assert.match(output, /0 spec\(s\) · 0 arquivo\(s\) · 0 erro\(s\) · 0 aviso\(s\) · 5ms/);
});

test("formatJson: produz JSON válido e parseável, com o mesmo conteúdo do report", () => {
  const report = buildReport();
  const json = formatJson(report);

  const parsed = JSON.parse(json);
  assert.deepEqual(parsed, report);
});
