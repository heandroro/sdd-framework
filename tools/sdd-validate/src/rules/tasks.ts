import type { Finding, ParsedSpec, Rule, SpecContext } from "../types";

const REQUIRED_APM_TASKS = ["T-APM-01", "T-APM-02", "T-APM-03", "T-APM-04", "T-APM-05"];

/** R008 (REQ-1.7): as 5 tasks de instrumentação APM devem estar todas
 * presentes — lista as ausentes individualmente (uma Finding por task). */
export const r008RequiredApmTasksPresent: Rule = {
  id: "R008",
  name: "Tasks T-APM-01 a T-APM-05 presentes",
  severity: "error",
  appliesTo: "tasks",
  check(spec: ParsedSpec, _context: SpecContext): Finding[] {
    const declared = new Set(
      spec.ids.filter((id) => id.kind === "T-APM" && id.declaration).map((id) => id.value),
    );

    return REQUIRED_APM_TASKS.filter((task) => !declared.has(task)).map((task) => ({
      ruleId: "R008",
      severity: "error",
      file: spec.file,
      message: `Task obrigatória ausente: ${task}`,
      suggestion: `Adicione a task ${task} (instrumentação APM) em tasks.md.`,
    }));
  },
};

/**
 * R009 (REQ-1.8): toda task de implementação (T-IMP-xx) deve referenciar ao
 * menos um `REQ-x.x` na mesma linha/célula da tabela de tasks. T-APM-xx e
 * T-DOC-xx nunca são marcadas por esta regra — não têm rastreabilidade
 * funcional obrigatória (instrumentação e documentação, não requisito).
 */
export const r009ImplementationTasksTraceToReq: Rule = {
  id: "R009",
  name: "Tasks de implementação (T-IMP) referenciam REQ-x.x",
  severity: "warning",
  appliesTo: "tasks",
  check(spec: ParsedSpec, _context: SpecContext): Finding[] {
    const linesWithReqMention = new Set(
      spec.ids.filter((id) => id.kind === "REQ").map((id) => id.line),
    );

    const untraceable = spec.ids
      .filter((id) => id.kind === "T-IMP" && id.declaration)
      .filter((id) => !linesWithReqMention.has(id.line))
      .map((id) => id.value);

    if (untraceable.length === 0) return [];

    return [
      {
        ruleId: "R009",
        severity: "warning",
        file: spec.file,
        message: `Tasks de implementação sem referência [REQ-x.x]: ${untraceable.join(", ")}`,
        suggestion: "Adicione ao menos uma referência REQ-x.x na mesma linha/tabela de cada task listada.",
      },
    ];
  },
};

export const tasksRules: Rule[] = [r008RequiredApmTasksPresent, r009ImplementationTasksTraceToReq];
