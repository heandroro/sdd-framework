/**
 * Decisão de runtime (T-IMP-01): Node.js/TypeScript.
 *
 * Nenhum sinal de linguagem já em uso foi encontrado no repositório (sem
 * package.json/pyproject.toml/go.mod/CI na raiz) — decisão greenfield.
 * Node/TS foi escolhido por ser a opção mais comum para CLIs deste tipo
 * (parsing estrutural de markdown, saída JSON tipada) e por não exigir
 * runtime adicional em ambientes onde agentes de IA (Claude Code, Copilot
 * etc.) já rodam sobre Node. Ver .sdd/memory-bank/architecture.md (T-DOC-01)
 * para o registro formal desta decisão.
 */

import fs from "node:fs";
import type { DiscoveredFile } from "./discovery";
import { discoverSpecs } from "./discovery";
import { parseSpec } from "./parser";
import { runRules } from "./registry";
import { formatJson, formatText } from "./reporter";
import { allRules } from "./rules";
import {
  buildInternalFailureEvent,
  buildMetrics,
  buildValidationErrorEvents,
  buildValidationRunEvent,
  detectSource,
  emitTelemetry,
} from "./telemetry";
import type { ParsedSpec, SpecContext, SpecResult, SpecType, ValidationReport } from "./types";

const HELP_TEXT = `sdd-validate [target-dir] [options]

Argumentos:
  target-dir          Raiz do repositório a validar (default: CWD)

Opções:
  --format=text|json  Formato de saída (default: text)
  --spec=<tipo>        Validar apenas um tipo: requirements|design|tasks
  --strict             Tratar warnings como errors (para CI mais rigoroso)
  --help, -h           Exibe esta ajuda

Códigos de saída:
  0   Sucesso — nenhum erro encontrado (warnings não afetam)
  1   Pelo menos um erro encontrado (ou warning com --strict)
  2   Erro interno do validador (exceção não tratada)
`;

interface CliOptions {
  targetDir: string;
  format: "text" | "json";
  specFilter?: SpecType;
  strict: boolean;
}

type ParsedArgs = { help: true } | { error: string } | CliOptions;

const SPEC_TYPES: SpecType[] = ["requirements", "design", "tasks"];

function parseArgs(argv: string[]): ParsedArgs {
  let targetDir: string | undefined;
  let format: "text" | "json" = "text";
  let specFilter: SpecType | undefined;
  let strict = false;

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      return { help: true };
    } else if (arg === "--strict") {
      strict = true;
    } else if (arg.startsWith("--format=")) {
      const value = arg.slice("--format=".length);
      if (value !== "text" && value !== "json") {
        return { error: `Valor inválido para --format: "${value}" (use text ou json)` };
      }
      format = value;
    } else if (arg.startsWith("--spec=")) {
      const value = arg.slice("--spec=".length);
      if (!SPEC_TYPES.includes(value as SpecType)) {
        return { error: `Valor inválido para --spec: "${value}" (use requirements, design ou tasks)` };
      }
      specFilter = value as SpecType;
    } else if (arg.startsWith("--")) {
      return { error: `Opção desconhecida: ${arg}` };
    } else if (targetDir === undefined) {
      targetDir = arg;
    } else {
      return { error: `Argumento inesperado: ${arg}` };
    }
  }

  return { targetDir: targetDir ?? process.cwd(), format, specFilter, strict };
}

function groupBySpecDir(files: DiscoveredFile[]): Map<string, DiscoveredFile[]> {
  const groups = new Map<string, DiscoveredFile[]>();
  for (const file of files) {
    const group = groups.get(file.specDir) ?? [];
    group.push(file);
    groups.set(file.specDir, group);
  }
  return groups;
}

/** Descobre, faz o parse e valida todas as pastas de spec sob `targetDir`.
 * `specFilter`, quando presente, restringe quais regras rodam — mas o
 * context de cada pasta sempre inclui os 3 arquivos (quando existirem),
 * já que regras como R006 cruzam requirements.md com design.md. */
function buildReport(targetDir: string, specFilter: SpecType | undefined): ValidationReport {
  const files = discoverSpecs(targetDir);
  const groups = groupBySpecDir(files);
  const rules = specFilter ? allRules.filter((rule) => rule.appliesTo === specFilter) : allRules;

  const results: SpecResult[] = [];
  let filesScanned = 0;

  for (const [specDir, groupFiles] of groups) {
    const parsedByType: Partial<Record<SpecType, ParsedSpec>> = {};
    for (const file of groupFiles) {
      const content = fs.readFileSync(file.path, "utf8");
      parsedByType[file.type] = parseSpec(file.path, file.type, content);
      filesScanned += 1;
    }

    const context: SpecContext = {
      requirements: parsedByType.requirements,
      design: parsedByType.design,
      tasks: parsedByType.tasks,
    };

    results.push({ spec: specDir, findings: runRules(rules, context) });
  }

  const errors = results.reduce(
    (sum, result) => sum + result.findings.filter((f) => f.severity === "error").length,
    0,
  );
  const warnings = results.reduce(
    (sum, result) => sum + result.findings.filter((f) => f.severity === "warning").length,
    0,
  );

  return {
    summary: { specsScanned: results.length, filesScanned, errors, warnings, durationMs: 0 },
    results,
  };
}

export function main(argv: string[]): number {
  const parsed = parseArgs(argv);

  if ("help" in parsed) {
    process.stdout.write(HELP_TEXT);
    return 0;
  }

  if ("error" in parsed) {
    process.stderr.write(`sdd-validate: ${parsed.error}\n\n${HELP_TEXT}`);
    return 2;
  }

  try {
    const start = Date.now();
    const report = buildReport(parsed.targetDir, parsed.specFilter);
    report.summary.durationMs = Date.now() - start;

    const output = parsed.format === "json" ? formatJson(report) : formatText(report);
    process.stdout.write(`${output}\n`);

    const source = detectSource(process.env);
    emitTelemetry([
      { event: "Metrics", metrics: buildMetrics(report) },
      buildValidationRunEvent(report, { format: parsed.format, strict: parsed.strict, source }),
      ...buildValidationErrorEvents(report),
    ]);

    const hasErrors = report.summary.errors > 0;
    const hasStrictWarnings = parsed.strict && report.summary.warnings > 0;
    return hasErrors || hasStrictWarnings ? 1 : 0;
  } catch (error) {
    emitTelemetry([buildInternalFailureEvent(error, "cli.main")]);
    process.stderr.write(
      `sdd-validate: erro interno não tratado: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    return 2;
  }
}

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
