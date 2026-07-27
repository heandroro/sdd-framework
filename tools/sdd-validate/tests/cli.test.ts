import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { main } from "../src/cli";

function mkTempRepo(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sdd-validate-cli-"));
}

function writeSpec(repo: string, name: string, files: Record<string, string>): void {
  const dir = path.join(repo, ".sdd", "specs", name);
  fs.mkdirSync(dir, { recursive: true });
  for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, filename), content);
  }
}

/** Captura o que main() escreveria em stdout/stderr, sem poluir o teste. */
function captureOutput(run: () => number): { exitCode: number; stdout: string; stderr: string } {
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  let stdout = "";
  let stderr = "";

  process.stdout.write = ((chunk: string) => {
    stdout += chunk;
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string) => {
    stderr += chunk;
    return true;
  }) as typeof process.stderr.write;

  try {
    const exitCode = run();
    return { exitCode, stdout, stderr };
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }
}

const VALID_REQUIREMENTS = [
  "## Histórias de Usuário",
  "| REQ-1.1 | dado quando então |",
  "",
  "## Requisitos de Observabilidade (Application Performance Monitor)",
  "### O que precisa ser visível para o time de operações?",
  "- [ ] **[OBS-1]** métrica",
  "### O que precisa ser visível para o time de produto/negócio?",
  "- [ ] **[OBS-2]** kpi",
  "### Quais falhas precisam gerar alertas imediatos?",
  "- [ ] **[OBS-3]** alerta",
].join("\n");

const VALID_DESIGN = [
  "## Application Performance Monitor",
  "| APM-M1 | métrica | Counter | OBS-1 |",
  "| APM-M2 | métrica | Counter | OBS-2 |",
  "| APM-M3 | métrica | Counter | OBS-3 |",
].join("\n");

const VALID_TASKS = [
  "| T-IMP-01 | Scaffold | Implementação | REQ-1.1 |",
  "| T-APM-01 | Traces | APM | - |",
  "| T-APM-02 | Métricas | APM | - |",
  "| T-APM-03 | Eventos | APM | - |",
  "| T-APM-04 | Alertas | APM | - |",
  "| T-APM-05 | Dashboard | APM | - |",
].join("\n");

test("main: --help imprime a ajuda e retorna 0", () => {
  const { exitCode, stdout } = captureOutput(() => main(["--help"]));
  assert.equal(exitCode, 0);
  assert.match(stdout, /sdd-validate \[target-dir\]/);
});

test("main: --format inválido retorna 2 e escreve em stderr", () => {
  const { exitCode, stderr } = captureOutput(() => main(["--format=xml"]));
  assert.equal(exitCode, 2);
  assert.match(stderr, /Valor inválido para --format/);
});

test("main: --spec inválido retorna 2", () => {
  const { exitCode, stderr } = captureOutput(() => main(["--spec=nope"]));
  assert.equal(exitCode, 2);
  assert.match(stderr, /Valor inválido para --spec/);
});

test("main: opção desconhecida retorna 2", () => {
  const { exitCode, stderr } = captureOutput(() => main(["--bogus"]));
  assert.equal(exitCode, 2);
  assert.match(stderr, /Opção desconhecida/);
});

test("main: repo sem .sdd/specs retorna 0 com mensagem informativa (REQ-2.3)", (t) => {
  const repo = mkTempRepo();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));

  const { exitCode, stdout } = captureOutput(() => main([repo]));
  assert.equal(exitCode, 0);
  assert.match(stdout, /Nenhum spec encontrado/);
});

test("main: spec estruturalmente correta retorna exit 0", (t) => {
  const repo = mkTempRepo();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  writeSpec(repo, "demo", {
    "requirements.md": VALID_REQUIREMENTS,
    "design.md": VALID_DESIGN,
    "tasks.md": VALID_TASKS,
  });

  const { exitCode, stdout } = captureOutput(() => main([repo]));
  assert.equal(exitCode, 0);
  assert.match(stdout, /0 erro\(s\)/);
});

test("main: spec com erro (T-APM ausente) retorna exit 1", (t) => {
  const repo = mkTempRepo();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  writeSpec(repo, "demo", {
    "requirements.md": VALID_REQUIREMENTS,
    "design.md": VALID_DESIGN,
    "tasks.md": "| T-IMP-01 | Scaffold | Implementação | REQ-1.1 |",
  });

  const { exitCode, stdout } = captureOutput(() => main([repo]));
  assert.equal(exitCode, 1);
  assert.match(stdout, /R008/);
});

test("main: --strict transforma warning em exit 1", (t) => {
  const repo = mkTempRepo();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  writeSpec(repo, "demo", {
    "requirements.md": `${VALID_REQUIREMENTS}\n- [PREENCHER]\n`,
    "design.md": VALID_DESIGN,
    "tasks.md": VALID_TASKS,
  });

  const withoutStrict = captureOutput(() => main([repo]));
  assert.equal(withoutStrict.exitCode, 0);

  const withStrict = captureOutput(() => main([repo, "--strict"]));
  assert.equal(withStrict.exitCode, 1);
});

test("main: --spec=design roda só as regras de design", (t) => {
  const repo = mkTempRepo();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  writeSpec(repo, "demo", {
    "requirements.md": VALID_REQUIREMENTS,
    "design.md": VALID_DESIGN,
    // tasks.md sem T-APM (geraria erro R008) — mas --spec=design não deve rodar R008.
    "tasks.md": "| T-IMP-01 | Scaffold | Implementação | REQ-1.1 |",
  });

  const { exitCode, stdout } = captureOutput(() => main([repo, "--spec=design"]));
  assert.equal(exitCode, 0);
  assert.doesNotMatch(stdout, /R008/);
});

test("main: --format=json produz JSON parseável com o schema esperado", (t) => {
  const repo = mkTempRepo();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  writeSpec(repo, "demo", {
    "requirements.md": VALID_REQUIREMENTS,
    "design.md": VALID_DESIGN,
    "tasks.md": VALID_TASKS,
  });

  const { exitCode, stdout } = captureOutput(() => main([repo, "--format=json"]));
  assert.equal(exitCode, 0);

  const parsed = JSON.parse(stdout);
  assert.equal(parsed.summary.specsScanned, 1);
  assert.equal(parsed.summary.filesScanned, 3);
  assert.equal(parsed.summary.errors, 0);
  assert.equal(Array.isArray(parsed.results), true);
});
