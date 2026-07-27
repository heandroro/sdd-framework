import type { Finding, ParsedSpec, Rule, SpecContext } from "../types";

/**
 * As 3 subseções canônicas exigidas pelo template
 * (.sdd/specs/_template/requirements.md) dentro de
 * "## Requisitos de Observabilidade (Application Performance Monitor)".
 */
const OBSERVABILITY_SUBSECTIONS = [
  "O que precisa ser visível para o time de operações?",
  "O que precisa ser visível para o time de produto/negócio?",
  "Quais falhas precisam gerar alertas imediatos?",
];

/** Última linha coberta pela seção em `spec.sections[index]` (até a próxima
 * seção de nível igual ou mais raso, ou fim do arquivo). */
function sectionEndLine(spec: ParsedSpec, index: number): number {
  const heading = spec.sections[index];
  for (let i = index + 1; i < spec.sections.length; i++) {
    if (spec.sections[i].level <= heading.level) {
      return spec.sections[i].line - 1;
    }
  }
  return Number.POSITIVE_INFINITY;
}

/** R001 (REQ-1.1): cada subseção de observabilidade deve ter ao menos 1 OBS-x. */
export const r001ObservabilitySubsectionsFilled: Rule = {
  id: "R001",
  name: "Cada subseção de Requisitos de Observabilidade deve ter ao menos um OBS-x",
  severity: "error",
  appliesTo: "requirements",
  check(spec: ParsedSpec, _context: SpecContext): Finding[] {
    const findings: Finding[] = [];

    for (const title of OBSERVABILITY_SUBSECTIONS) {
      const index = spec.sections.findIndex((s) => s.title === title);

      if (index === -1) {
        findings.push({
          ruleId: "R001",
          severity: "error",
          file: spec.file,
          message: `Subseção obrigatória ausente em Requisitos de Observabilidade: "${title}"`,
          suggestion: `Adicione a subseção "### ${title}" com ao menos um item [OBS-x].`,
        });
        continue;
      }

      const heading = spec.sections[index];
      const end = sectionEndLine(spec, index);
      const hasObs = spec.ids.some(
        (id) => id.kind === "OBS" && id.declaration && id.line > heading.line && id.line <= end,
      );

      if (!hasObs) {
        findings.push({
          ruleId: "R001",
          severity: "error",
          file: spec.file,
          line: heading.line,
          message: `Subseção "${title}" não contém nenhum item [OBS-x] preenchido`,
          suggestion: "Adicione ao menos um item [OBS-x] com a descrição do comportamento observável.",
        });
      }
    }

    return findings;
  },
};

/** R002 (REQ-1.2): nenhuma ocorrência de [PREENCHER] deve restar. */
export const r002NoPlaceholders: Rule = {
  id: "R002",
  name: "Sem placeholders [PREENCHER] pendentes",
  severity: "warning",
  appliesTo: "requirements",
  check(spec: ParsedSpec, _context: SpecContext): Finding[] {
    return spec.placeholders.map((placeholder) => ({
      ruleId: "R002",
      severity: "warning",
      file: spec.file,
      line: placeholder.line,
      message: "Placeholder [PREENCHER] não substituído",
      suggestion: "Preencha o campo com o conteúdo real antes de finalizar a spec.",
    }));
  },
};

/** R003 (REQ-1.3): IDs REQ-x.x devem ser únicos. */
export const r003UniqueReqIds: Rule = {
  id: "R003",
  name: "IDs REQ-x.x únicos",
  severity: "error",
  appliesTo: "requirements",
  check(spec: ParsedSpec, _context: SpecContext): Finding[] {
    const linesByValue = new Map<string, number[]>();
    for (const id of spec.ids) {
      if (id.kind !== "REQ" || !id.declaration) continue;
      const lines = linesByValue.get(id.value) ?? [];
      lines.push(id.line);
      linesByValue.set(id.value, lines);
    }

    const findings: Finding[] = [];
    for (const [value, lines] of linesByValue) {
      if (lines.length <= 1) continue;
      findings.push({
        ruleId: "R003",
        severity: "error",
        file: spec.file,
        line: lines[lines.length - 1],
        message: `ID de requisito duplicado: ${value} (linhas ${lines.join(", ")})`,
        suggestion: `Renomeie uma das ocorrências de ${value} para um ID único.`,
      });
    }
    return findings;
  },
};

/** R004 (REQ-1.4): ao menos um bloco REQ-x.x deve estar presente. */
export const r004AtLeastOneReq: Rule = {
  id: "R004",
  name: "Ao menos um bloco REQ-x.x presente",
  severity: "error",
  appliesTo: "requirements",
  check(spec: ParsedSpec, _context: SpecContext): Finding[] {
    const hasReq = spec.ids.some((id) => id.kind === "REQ" && id.declaration);
    if (hasReq) return [];

    return [
      {
        ruleId: "R004",
        severity: "error",
        file: spec.file,
        message: "Nenhum ID de requisito (REQ-x.x) encontrado no arquivo",
        suggestion: "Adicione ao menos uma história de usuário com critérios de aceite REQ-x.x.",
      },
    ];
  },
};

export const requirementsRules: Rule[] = [
  r001ObservabilitySubsectionsFilled,
  r002NoPlaceholders,
  r003UniqueReqIds,
  r004AtLeastOneReq,
];
