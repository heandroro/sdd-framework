export type SpecType = "requirements" | "design" | "tasks";

export type SpecIdKind =
  | "REQ"
  | "OBS"
  | "APM-M"
  | "APM-E"
  | "T-IMP"
  | "T-APM"
  | "T-DOC";

export interface Section {
  title: string;
  level: number;
  line: number;
}

export interface SpecId {
  kind: SpecIdKind;
  value: string;
  line: number;
  /** true quando o ID é uma declaração real (célula inteira de uma linha de
   * tabela, ex: `| APM-M1 | ... |`, ou envolto em `**[ID]**`); false quando é
   * apenas uma menção em prosa (ex: "OBS-1 → APM-M1..M4", "(APM-M1..M5)").
   * Regras que checam unicidade/presença devem considerar só declarações. */
  declaration: boolean;
}

export interface Placeholder {
  line: number;
  context: string;
}

export interface ParsedSpec {
  file: string;
  type: SpecType;
  sections: Section[];
  ids: SpecId[];
  placeholders: Placeholder[];
  rawLines: string[];
}

export type Severity = "error" | "warning";

export interface Finding {
  ruleId: string;
  severity: Severity;
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
}

/** ParsedSpecs "irmãos" (mesma pasta de spec), usados por regras que
 * cruzam arquivos — ex: R006 confere OBS-x de requirements.md contra
 * APM-Mx/APM-Ex de design.md. */
export interface SpecContext {
  requirements?: ParsedSpec;
  design?: ParsedSpec;
  tasks?: ParsedSpec;
}

export interface Rule {
  id: string;
  name: string;
  severity: Severity;
  appliesTo: SpecType;
  check(spec: ParsedSpec, context: SpecContext): Finding[];
}

export interface ValidationSummary {
  specsScanned: number;
  filesScanned: number;
  errors: number;
  warnings: number;
  durationMs: number;
}

/** Findings de uma pasta de spec (`.sdd/specs/<nome>`) — unidade de
 * agrupamento em `ValidationReport.results`, conforme o schema JSON estável
 * documentado em design.md. */
export interface SpecResult {
  spec: string;
  findings: Finding[];
}

export interface ValidationReport {
  summary: ValidationSummary;
  results: SpecResult[];
}
