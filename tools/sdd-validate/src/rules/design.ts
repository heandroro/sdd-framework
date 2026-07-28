import type { Finding, ParsedSpec, Rule, SpecContext } from "../types";

function isApmSectionTitle(title: string): boolean {
  return /application performance monitor/i.test(title) || /\bapm\b/i.test(title);
}

function obsNumber(value: string): number {
  return Number(value.split("-")[1]);
}

/**
 * No design.md real, a cobertura OBS→APM é expressa por co-ocorrência na
 * mesma linha (normalmente uma linha de tabela): a linha que declara
 * `APM-M1`/`APM-E1` também lista, na última célula, os `OBS-x` que aquela
 * métrica/evento cobre (ex: `| APM-M1 | ... | ... | OBS-1 |`). Por isso a
 * verificação é "há algum APM-Mx/APM-Ex na mesma linha que este OBS-x?".
 */
function collectApmCoverage(designSpec: ParsedSpec): Set<string> {
  const byLine = new Map<number, { obs: string[]; hasApm: boolean }>();

  for (const id of designSpec.ids) {
    if (id.kind !== "OBS" && id.kind !== "APM-M" && id.kind !== "APM-E") continue;
    if (!id.declaration) continue;
    const entry = byLine.get(id.line) ?? { obs: [], hasApm: false };
    if (id.kind === "OBS") entry.obs.push(id.value);
    else entry.hasApm = true;
    byLine.set(id.line, entry);
  }

  const covered = new Set<string>();
  for (const { obs, hasApm } of byLine.values()) {
    if (!hasApm) continue;
    for (const value of obs) covered.add(value);
  }
  return covered;
}

/** R005 (REQ-1.5): design.md deve ter uma seção Application Performance Monitor / APM. */
export const r005ApmSectionPresent: Rule = {
  id: "R005",
  name: "Seção Application Performance Monitor / APM presente",
  severity: "error",
  appliesTo: "design",
  check(spec: ParsedSpec, _context: SpecContext): Finding[] {
    const hasApmSection = spec.sections.some((s) => isApmSectionTitle(s.title));
    if (hasApmSection) return [];

    return [
      {
        ruleId: "R005",
        severity: "error",
        file: spec.file,
        message: 'Seção obrigatória ausente: nenhum heading contém "Application Performance Monitor" ou "APM"',
        suggestion: 'Adicione uma seção "## Application Performance Monitor" (ou "## APM") com traces, métricas, eventos, SLOs e alertas.',
      },
    ];
  },
};

/** R006 (REQ-1.6): cada OBS-x do requirements.md correspondente tem APM-Mx/APM-Ex. */
export const r006ObsHasApmCoverage: Rule = {
  id: "R006",
  name: "Cada OBS-x do requirements.md correspondente tem cobertura APM-Mx/APM-Ex",
  severity: "error",
  appliesTo: "design",
  check(spec: ParsedSpec, context: SpecContext): Finding[] {
    if (!context.requirements) {
      return [
        {
          ruleId: "R006",
          severity: "warning",
          file: spec.file,
          message: "Não foi possível verificar cobertura OBS→APM: requirements.md correspondente não encontrado",
          suggestion: "Garanta que requirements.md exista na mesma pasta de spec para habilitar esta verificação.",
        },
      ];
    }

    const requiredObs = new Set(
      context.requirements.ids.filter((id) => id.kind === "OBS").map((id) => id.value),
    );
    if (requiredObs.size === 0) return [];

    const covered = collectApmCoverage(spec);
    const uncovered = [...requiredObs]
      .filter((obs) => !covered.has(obs))
      .sort((a, b) => obsNumber(a) - obsNumber(b));

    if (uncovered.length === 0) return [];

    return [
      {
        ruleId: "R006",
        severity: "error",
        file: spec.file,
        message: `OBS-x sem cobertura APM-Mx/APM-Ex: ${uncovered.join(", ")}`,
        suggestion: "Adicione uma métrica (APM-Mx) ou evento (APM-Ex) referenciando, na mesma linha/tabela, cada OBS-x listado.",
      },
    ];
  },
};

/** R007 (REQ-1.6): IDs APM-Mx/APM-Ex devem ser únicos no arquivo. */
export const r007UniqueApmIds: Rule = {
  id: "R007",
  name: "IDs APM-Mx/APM-Ex únicos",
  severity: "error",
  appliesTo: "design",
  check(spec: ParsedSpec, _context: SpecContext): Finding[] {
    const linesByValue = new Map<string, number[]>();
    for (const id of spec.ids) {
      if ((id.kind !== "APM-M" && id.kind !== "APM-E") || !id.declaration) continue;
      const lines = linesByValue.get(id.value) ?? [];
      lines.push(id.line);
      linesByValue.set(id.value, lines);
    }

    const findings: Finding[] = [];
    for (const [value, lines] of linesByValue) {
      if (lines.length <= 1) continue;
      findings.push({
        ruleId: "R007",
        severity: "error",
        file: spec.file,
        line: lines[lines.length - 1],
        message: `ID APM duplicado: ${value} (linhas ${lines.join(", ")})`,
        suggestion: `Renomeie uma das ocorrências de ${value} para um ID único.`,
      });
    }
    return findings;
  },
};

export const designRules: Rule[] = [
  r005ApmSectionPresent,
  r006ObsHasApmCoverage,
  r007UniqueApmIds,
];
