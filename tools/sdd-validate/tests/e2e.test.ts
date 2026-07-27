import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const FIXTURES = path.join(__dirname, "..", "..", "tests", "fixtures");
const BIN = path.join(__dirname, "..", "..", "bin", "sdd-validate.js");

function run(cwd: string, args: string[]): { status: number; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: "utf8" });
  return { status: result.status ?? -1, stdout: result.stdout, stderr: result.stderr };
}

test("e2e: --help via processo real retorna exit 0", () => {
  const { status, stdout } = run(process.cwd(), ["--help"]);
  assert.equal(status, 0);
  assert.match(stdout, /sdd-validate \[target-dir\]/);
});

test("e2e: valid-spec via processo real — exit 0", () => {
  const { status } = run(path.join(FIXTURES, "valid-spec"), ["."]);
  assert.equal(status, 0);
});

test("e2e: missing-tapm via processo real — exit 1, erros R008", () => {
  const { status, stdout } = run(path.join(FIXTURES, "missing-tapm"), ["."]);
  assert.equal(status, 1);
  assert.match(stdout, /R008/);
});

test("e2e: no-req-ref via processo real — exit 0, warning R009", () => {
  const { status, stdout } = run(path.join(FIXTURES, "no-req-ref"), ["."]);
  assert.equal(status, 0);
  assert.match(stdout, /R009/);
});

test("e2e: placeholders via processo real — exit 0, warning R002", () => {
  const { status, stdout } = run(path.join(FIXTURES, "placeholders"), ["."]);
  assert.equal(status, 0);
  assert.match(stdout, /R002/);
});

test("e2e: no-specs via processo real — exit 0, mensagem informativa (REQ-2.3)", () => {
  const { status, stdout } = run(path.join(FIXTURES, "no-specs"), ["."]);
  assert.equal(status, 0);
  assert.match(stdout, /Nenhum spec encontrado/);
});

test("e2e: --format inválido via processo real — exit 2", () => {
  const { status, stderr } = run(process.cwd(), ["--format=xml"]);
  assert.equal(status, 2);
  assert.match(stderr, /Valor inválido para --format/);
});

test("e2e (contrato/snapshot): missing-tapm --format=json bate com o golden file (durationMs ignorado)", () => {
  const { status, stdout } = run(path.join(FIXTURES, "missing-tapm"), [".", "--format=json"]);
  assert.equal(status, 1);

  const actual = JSON.parse(stdout);
  actual.summary.durationMs = 0;

  const golden = JSON.parse(fs.readFileSync(path.join(FIXTURES, "golden", "missing-tapm.json"), "utf8"));

  assert.deepEqual(actual, golden);
});
