import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { main } from "../src/cli";

const FIXTURES = path.join(__dirname, "..", "..", "tests", "fixtures");

function captureStdout(run: () => number): { exitCode: number; stdout: string } {
  const original = process.stdout.write.bind(process.stdout);
  let stdout = "";
  process.stdout.write = ((chunk: string) => {
    stdout += chunk;
    return true;
  }) as typeof process.stdout.write;

  try {
    return { exitCode: run(), stdout };
  } finally {
    process.stdout.write = original;
  }
}

test("integração: valid-spec é estruturalmente correta — exit 0, zero findings", () => {
  const { exitCode, stdout } = captureStdout(() => main([path.join(FIXTURES, "valid-spec")]));
  assert.equal(exitCode, 0);
  assert.match(stdout, /1 spec\(s\) · 3 arquivo\(s\) · 0 erro\(s\) · 0 aviso\(s\)/);
});

test("integração: missing-tapm reporta 2 erros R008 (T-APM-03 e T-APM-05) — exit 1", () => {
  const { exitCode, stdout } = captureStdout(() => main([path.join(FIXTURES, "missing-tapm")]));
  assert.equal(exitCode, 1);
  assert.match(stdout, /T-APM-03/);
  assert.match(stdout, /T-APM-05/);
  assert.match(stdout, /2 erro\(s\)/);
});

test("integração: no-req-ref reporta 1 warning R009 (T-IMP-01) — exit 0 (warning não bloqueia)", () => {
  const { exitCode, stdout } = captureStdout(() => main([path.join(FIXTURES, "no-req-ref")]));
  assert.equal(exitCode, 0);
  assert.match(stdout, /T-IMP-01/);
  assert.match(stdout, /1 aviso\(s\)/);
});

test("integração: placeholders reporta 1 warning R002 — exit 0", () => {
  const { exitCode, stdout } = captureStdout(() => main([path.join(FIXTURES, "placeholders")]));
  assert.equal(exitCode, 0);
  assert.match(stdout, /R002/);
  assert.match(stdout, /1 aviso\(s\)/);
});

test("integração: no-specs (sem .sdd/specs) — exit 0, mensagem informativa (REQ-2.3)", () => {
  const { exitCode, stdout } = captureStdout(() => main([path.join(FIXTURES, "no-specs")]));
  assert.equal(exitCode, 0);
  assert.match(stdout, /Nenhum spec encontrado/);
});
