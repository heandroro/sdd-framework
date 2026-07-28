import type { ParsedSpec, Placeholder, Section, SpecId, SpecIdKind, SpecType } from "./types";

const SECTION_RE = /^(#{1,6})\s+(.+?)\s*$/;
const REQ_RE = /\bREQ-\d+\.\d+\b/g;
const OBS_RE = /\bOBS-\d+\b/g;
const APM_RE = /\bAPM-[ME]\d+\b/g;
const TASK_RE = /\bT-(?:IMP|APM|DOC)-\d+\b/g;
const PLACEHOLDER_RE = /\[PREENCHER\]/g;
const INLINE_CODE_RE = /`[^`]*`/g;

function kindOf(value: string): SpecIdKind {
  if (value.startsWith("REQ-")) return "REQ";
  if (value.startsWith("OBS-")) return "OBS";
  if (value.startsWith("APM-M")) return "APM-M";
  if (value.startsWith("APM-E")) return "APM-E";
  if (value.startsWith("T-IMP-")) return "T-IMP";
  if (value.startsWith("T-APM-")) return "T-APM";
  if (value.startsWith("T-DOC-")) return "T-DOC";
  throw new Error(`Não foi possível classificar o ID: ${value}`);
}

/** Trechos de `código inline` da linha — usados para ignorar IDs/placeholders
 * citados como exemplo dentro de crases (ex: "duplicados (ex: dois
 * `REQ-1.1`)"), que não são declarações reais. */
function inlineCodeRanges(line: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  INLINE_CODE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = INLINE_CODE_RE.exec(line)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function isInsideCode(index: number, codeRanges: Array<[number, number]>): boolean {
  return codeRanges.some(([start, end]) => index >= start && index < end);
}

const ANY_ID_RE = /\bREQ-\d+\.\d+\b|\bOBS-\d+\b|\bAPM-[ME]\d+\b|\bT-(?:IMP|APM|DOC)-\d+\b/g;

/** Limites [início, fim) da célula de tabela que envolve `index` (entre o
 * `|` mais próximo antes e o mais próximo depois), ou `null` se a linha não
 * tiver um `|` de cada lado (não é uma linha de tabela). */
function enclosingCell(line: string, index: number): [number, number] | null {
  const cellStart = line.lastIndexOf("|", Math.max(index - 1, 0));
  const cellEnd = line.indexOf("|", index);
  if (cellStart === -1 || cellEnd === -1) return null;
  return [cellStart + 1, cellEnd];
}

/** Uma célula "só de IDs" é aquela cujo conteúdo, após remover todos os IDs
 * reconhecidos, sobra apenas pontuação/separadores (vírgula, `+`, espaço) —
 * cobre tanto células com um único ID (`APM-M1`) quanto listas (`OBS-1,
 * OBS-4`), sem aceitar células de prosa que só citam um ID de passagem. */
function isIdOnlyCell(cellText: string): boolean {
  const stripped = cellText.replace(ANY_ID_RE, "").trim();
  const hadAtLeastOneId = stripped.length < cellText.trim().length;
  return hadAtLeastOneId && /^[\s,+.]*$/.test(stripped);
}

/**
 * Um ID é uma DECLARAÇÃO real quando:
 *  - sua célula de tabela contém só IDs (e separadores) — cobre tanto célula
 *    de valor único (`| APM-M1 | ... |`) quanto lista (`... | OBS-1, OBS-4 |`
 *    na tabela de Custom Events de design.md), ou
 *  - está envolto em `**[ID]**` (convenção usada para itens OBS-x em listas).
 *
 * Qualquer outra ocorrência (prosa, ranges como "APM-M1..M5", mapeamentos
 * como "OBS-1 → APM-M1..M4", texto de dashboard) é apenas uma MENÇÃO — não
 * conta para checagens de unicidade/presença.
 */
function isDeclaration(line: string, start: number, end: number): boolean {
  const before = line.slice(0, start);
  const after = line.slice(end);
  if (before.endsWith("**[") && after.startsWith("]**")) return true;

  const cell = enclosingCell(line, start);
  if (cell) {
    const [cellStart, cellEnd] = cell;
    if (isIdOnlyCell(line.slice(cellStart, cellEnd))) return true;
  }

  return false;
}

function collectIds(
  re: RegExp,
  line: string,
  lineNumber: number,
  ids: SpecId[],
  codeRanges: Array<[number, number]>,
): void {
  re.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (isInsideCode(match.index, codeRanges)) continue;
    const value = match[0];
    const end = match.index + value.length;
    ids.push({
      kind: kindOf(value),
      value,
      line: lineNumber,
      declaration: isDeclaration(line, match.index, end),
    });
  }
}

function collectPlaceholders(
  line: string,
  lineNumber: number,
  placeholders: Placeholder[],
  codeRanges: Array<[number, number]>,
): void {
  PLACEHOLDER_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER_RE.exec(line)) !== null) {
    if (isInsideCode(match.index, codeRanges)) continue;
    placeholders.push({ line: lineNumber, context: line.trim() });
  }
}

/**
 * Extrai estrutura de um arquivo de spec (requirements/design/tasks.md):
 * seções `##`, IDs conhecidos (REQ-x.x, OBS-x, APM-Mx/APM-Ex, T-IMP/APM/DOC-xx)
 * e ocorrências literais de `[PREENCHER]`, todos com o número da linha.
 *
 * Não deduplica nem valida IDs — isso é responsabilidade das regras
 * (R001-R009), que recebem o ParsedSpec já "cru".
 */
export function parseSpec(file: string, type: SpecType, content: string): ParsedSpec {
  const rawLines = content.split(/\r?\n/);
  const sections: Section[] = [];
  const ids: SpecId[] = [];
  const placeholders: Placeholder[] = [];

  rawLines.forEach((line, index) => {
    const lineNumber = index + 1;

    const sectionMatch = SECTION_RE.exec(line);
    if (sectionMatch) {
      sections.push({ title: sectionMatch[2], level: sectionMatch[1].length, line: lineNumber });
    }

    const codeRanges = inlineCodeRanges(line);
    collectIds(REQ_RE, line, lineNumber, ids, codeRanges);
    collectIds(OBS_RE, line, lineNumber, ids, codeRanges);
    collectIds(APM_RE, line, lineNumber, ids, codeRanges);
    collectIds(TASK_RE, line, lineNumber, ids, codeRanges);
    collectPlaceholders(line, lineNumber, placeholders, codeRanges);
  });

  return { file, type, sections, ids, placeholders, rawLines };
}
