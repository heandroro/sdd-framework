import type { Finding, ParsedSpec, Rule, SpecContext } from "./types";

function runRule(rule: Rule, spec: ParsedSpec, context: SpecContext): Finding[] {
  try {
    return rule.check(spec, context);
  } catch (error) {
    return [
      {
        ruleId: "R000",
        severity: "error",
        file: spec.file,
        message: `Erro interno na regra ${rule.id}: ${error instanceof Error ? error.message : String(error)}`,
      },
    ];
  }
}

/**
 * Roda, para cada ParsedSpec presente no `context` (requirements/design/tasks
 * de uma mesma pasta de spec), todas as regras cujo `appliesTo` bate com o
 * tipo do arquivo. Uma exceção lançada por uma regra é isolada num finding
 * sintético `R000` — não derruba a execução das demais regras.
 */
export function runRules(rules: Rule[], context: SpecContext): Finding[] {
  const specs = [context.requirements, context.design, context.tasks].filter(
    (spec): spec is ParsedSpec => spec !== undefined,
  );

  const findings: Finding[] = [];
  for (const spec of specs) {
    for (const rule of rules) {
      if (rule.appliesTo !== spec.type) continue;
      findings.push(...runRule(rule, spec, context));
    }
  }

  return findings;
}
