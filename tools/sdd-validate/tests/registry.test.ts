import assert from "node:assert/strict";
import { test } from "node:test";
import { runRules } from "../src/registry";
import type { Finding, ParsedSpec, Rule, SpecContext } from "../src/types";

function emptySpec(type: ParsedSpec["type"], file: string): ParsedSpec {
  return { file, type, sections: [], ids: [], placeholders: [], rawLines: [] };
}

function fixedFindingRule(id: string, appliesTo: ParsedSpec["type"], finding: Finding): Rule {
  return {
    id,
    name: id,
    severity: finding.severity,
    appliesTo,
    check: () => [finding],
  };
}

test("runRules: só roda regras cujo appliesTo bate com o tipo de cada spec presente no context", () => {
  const requirements = emptySpec("requirements", "requirements.md");
  const design = emptySpec("design", "design.md");
  const context: SpecContext = { requirements, design };

  const rules: Rule[] = [
    fixedFindingRule("RA", "requirements", {
      ruleId: "RA",
      severity: "error",
      file: "requirements.md",
      message: "erro requirements",
    }),
    fixedFindingRule("RB", "design", {
      ruleId: "RB",
      severity: "warning",
      file: "design.md",
      message: "aviso design",
    }),
    fixedFindingRule("RC", "tasks", {
      ruleId: "RC",
      severity: "error",
      file: "tasks.md",
      message: "não deveria rodar — tasks.md ausente do context",
    }),
  ];

  const findings = runRules(rules, context);

  assert.deepEqual(
    findings.map((f) => f.ruleId),
    ["RA", "RB"],
  );
});

test("runRules: isola exceção de uma regra num finding sintético R000, sem impedir as demais regras", () => {
  const requirements = emptySpec("requirements", "requirements.md");
  const context: SpecContext = { requirements };

  const throwingRule: Rule = {
    id: "RBROKEN",
    name: "regra quebrada",
    severity: "error",
    appliesTo: "requirements",
    check: () => {
      throw new Error("bug interno da regra");
    },
  };

  const okRule = fixedFindingRule("ROK", "requirements", {
    ruleId: "ROK",
    severity: "warning",
    file: "requirements.md",
    message: "aviso normal",
  });

  const findings = runRules([throwingRule, okRule], context);

  assert.equal(findings.length, 2);
  assert.equal(findings[0].ruleId, "R000");
  assert.equal(findings[0].severity, "error");
  assert.match(findings[0].message, /RBROKEN/);
  assert.match(findings[0].message, /bug interno da regra/);
  assert.equal(findings[1].ruleId, "ROK");
});
