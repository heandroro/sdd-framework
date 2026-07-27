import type { Finding, ValidationReport } from "./types";

function severityPrefix(severity: Finding["severity"]): string {
  return severity === "error" ? "[ERROR]" : "[WARN]";
}

function formatFinding(finding: Finding): string[] {
  const location = finding.line !== undefined ? `${finding.file}:${finding.line}` : finding.file;
  const lines = [`  ${severityPrefix(finding.severity)} ${location} · ${finding.ruleId} — ${finding.message}`];
  if (finding.suggestion) {
    lines.push(`    Sugestão: ${finding.suggestion}`);
  }
  return lines;
}

/** Agrupa os findings de um SpecResult por arquivo, preservando a ordem de
 * primeira aparição de cada arquivo. */
function groupByFile(findings: Finding[]): Map<string, Finding[]> {
  const byFile = new Map<string, Finding[]>();
  for (const finding of findings) {
    const forFile = byFile.get(finding.file) ?? [];
    forFile.push(finding);
    byFile.set(finding.file, forFile);
  }
  return byFile;
}

/** Formato texto legível por humanos: findings agrupados por arquivo,
 * prefixados `[ERROR]`/`[WARN]`, com linha e sugestão quando disponíveis. */
export function formatText(report: ValidationReport): string {
  const lines: string[] = [];

  for (const result of report.results) {
    if (result.findings.length === 0) continue;

    lines.push(`${result.spec}:`);
    for (const findingsForFile of groupByFile(result.findings).values()) {
      for (const finding of findingsForFile) {
        lines.push(...formatFinding(finding));
      }
    }
  }

  if (lines.length === 0) {
    lines.push("Nenhum spec encontrado ou nenhum finding gerado.");
  }

  const { specsScanned, filesScanned, errors, warnings, durationMs } = report.summary;
  lines.push("");
  lines.push(
    `${specsScanned} spec(s) · ${filesScanned} arquivo(s) · ${errors} erro(s) · ${warnings} aviso(s) · ${durationMs}ms`,
  );

  return lines.join("\n");
}

/** Formato JSON estável (contrato documentado em design.md): serializa
 * `{ summary, results }` diretamente — sempre um JSON válido e parseável. */
export function formatJson(report: ValidationReport): string {
  return JSON.stringify(report, null, 2);
}
