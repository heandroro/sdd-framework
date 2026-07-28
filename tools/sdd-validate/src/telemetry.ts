import type { ValidationReport } from "./types";

/**
 * T-APM-01 — Traces distribuídos: N/A.
 *
 * O sdd-validate é um CLI síncrono, de processo único, sem chamadas a
 * serviços externos (não há rede, não há downstream para propagar um trace
 * distribuído). Traces não se aplicam aqui — a unidade observável relevante
 * é a própria execução do processo (ValidationRun), não um span distribuído.
 * Este "N/A com justificativa" é o padrão reutilizável documentado em
 * .sdd/memory-bank/architecture.md (T-DOC-01) para CLIs síncronos do
 * framework.
 */

export type TelemetrySource = "human" | "agent";

/** APM-M1–M5 (design.md → Métricas Customizadas). Nomenclatura alinhada ao
 * padrão `sdd.validator.*` de .sdd/memory-bank/apm-standards.md. */
export interface Metrics {
  "sdd.validator.specs_scanned.count": number;
  "sdd.validator.errors.count": number;
  "sdd.validator.warnings.count": number;
  "sdd.validator.duration.ms": number;
  "sdd.validator.errors_by_rule.count": Record<string, number>;
}

export interface MetricsEvent {
  event: "Metrics";
  metrics: Metrics;
}

/** APM-E1 — emitido ao final de toda execução do CLI. */
export interface ValidationRunEvent {
  event: "ValidationRun";
  specsScanned: number;
  filesScanned: number;
  errors: number;
  warnings: number;
  durationMs: number;
  format: "text" | "json";
  strict: boolean;
  source: TelemetrySource;
}

/** APM-E2 — um evento por regra que gerou ≥1 erro numa pasta de spec. */
export interface ValidationErrorEvent {
  event: "ValidationError";
  ruleId: string;
  specPath: string;
  severity: "error";
  occurrences: number;
}

/** APM-E3 — exceção não tratada. Nunca contém conteúdo de specs (OBS-5). */
export interface InternalFailureEvent {
  event: "InternalFailure";
  errorCode: string;
  component: string;
  message: string;
}

export type TelemetryEvent = MetricsEvent | ValidationRunEvent | ValidationErrorEvent | InternalFailureEvent;

/** Detecta se a chamada veio de um agente de IA (OBS-4) via `SDD_CALLER=agent`. */
export function detectSource(env: NodeJS.ProcessEnv): TelemetrySource {
  return env.SDD_CALLER === "agent" ? "agent" : "human";
}

export function buildMetrics(report: ValidationReport): Metrics {
  const errorsByRule: Record<string, number> = {};
  for (const result of report.results) {
    for (const finding of result.findings) {
      if (finding.severity !== "error") continue;
      errorsByRule[finding.ruleId] = (errorsByRule[finding.ruleId] ?? 0) + 1;
    }
  }

  return {
    "sdd.validator.specs_scanned.count": report.summary.specsScanned,
    "sdd.validator.errors.count": report.summary.errors,
    "sdd.validator.warnings.count": report.summary.warnings,
    "sdd.validator.duration.ms": report.summary.durationMs,
    "sdd.validator.errors_by_rule.count": errorsByRule,
  };
}

export function buildValidationRunEvent(
  report: ValidationReport,
  options: { format: "text" | "json"; strict: boolean; source: TelemetrySource },
): ValidationRunEvent {
  return {
    event: "ValidationRun",
    specsScanned: report.summary.specsScanned,
    filesScanned: report.summary.filesScanned,
    errors: report.summary.errors,
    warnings: report.summary.warnings,
    durationMs: report.summary.durationMs,
    format: options.format,
    strict: options.strict,
    source: options.source,
  };
}

export function buildValidationErrorEvents(report: ValidationReport): ValidationErrorEvent[] {
  const events: ValidationErrorEvent[] = [];

  for (const result of report.results) {
    const occurrencesByRule = new Map<string, number>();
    for (const finding of result.findings) {
      if (finding.severity !== "error") continue;
      occurrencesByRule.set(finding.ruleId, (occurrencesByRule.get(finding.ruleId) ?? 0) + 1);
    }

    for (const [ruleId, occurrences] of occurrencesByRule) {
      events.push({ event: "ValidationError", ruleId, specPath: result.spec, severity: "error", occurrences });
    }
  }

  return events;
}

/** OBS-5: contexto suficiente para diagnóstico (errorCode + componente +
 * mensagem), sem nunca incluir caminho ou conteúdo de arquivos de spec. */
export function buildInternalFailureEvent(error: unknown, component: string): InternalFailureEvent {
  return {
    event: "InternalFailure",
    errorCode: "E_INTERNAL",
    component,
    message: error instanceof Error ? error.message : String(error),
  };
}

/**
 * Emite eventos de telemetria como JSON lines em STDERR — nunca em stdout,
 * para não contaminar a saída `--format=json` (que precisa continuar sendo
 * um único documento JSON válido e parseável, per REQ-3.4).
 */
export function emitTelemetry(events: TelemetryEvent[]): void {
  for (const event of events) {
    process.stderr.write(`[telemetry] ${JSON.stringify(event)}\n`);
  }
}
