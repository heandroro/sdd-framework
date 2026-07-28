import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { discoverSpecs } from "../src/discovery";

function mkTempRepo(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sdd-validate-discovery-"));
}

function writeSpecFiles(dir: string, files: string[]): void {
  fs.mkdirSync(dir, { recursive: true });
  for (const file of files) {
    fs.writeFileSync(path.join(dir, file), `# ${file}\n`);
  }
}

test("discoverSpecs: retorna lista vazia quando .sdd/specs não existe (REQ-2.3)", (t) => {
  const repo = mkTempRepo();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));

  assert.deepEqual(discoverSpecs(repo), []);
});

test("discoverSpecs: varre .sdd/specs/* excluindo _template", (t) => {
  const repo = mkTempRepo();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));

  writeSpecFiles(path.join(repo, ".sdd", "specs", "harness-sensors"), [
    "requirements.md",
    "design.md",
    "tasks.md",
  ]);
  writeSpecFiles(path.join(repo, ".sdd", "specs", "_template"), [
    "requirements.md",
    "design.md",
    "tasks.md",
  ]);

  const found = discoverSpecs(repo);

  assert.equal(found.length, 3);
  assert.ok(found.every((f) => f.specDir.endsWith("harness-sensors")));
  assert.deepEqual(
    found.map((f) => f.type).sort(),
    ["design", "requirements", "tasks"],
  );
});

test("discoverSpecs: retorna só os arquivos presentes quando a spec está incompleta", (t) => {
  const repo = mkTempRepo();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));

  writeSpecFiles(path.join(repo, ".sdd", "specs", "minha-feature"), ["requirements.md"]);

  const found = discoverSpecs(repo);

  assert.equal(found.length, 1);
  assert.equal(found[0].type, "requirements");
});

test("discoverSpecs: alvo apontado diretamente para uma pasta de spec é validado mesmo chamando-se _template", (t) => {
  const repo = mkTempRepo();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));

  const templateDir = path.join(repo, ".sdd", "specs", "_template");
  writeSpecFiles(templateDir, ["requirements.md", "design.md", "tasks.md"]);

  const found = discoverSpecs(templateDir);

  assert.equal(found.length, 3);
  assert.ok(found.every((f) => f.specDir === templateDir));
});

test("discoverSpecs: varre múltiplas pastas de spec em ordem determinística", (t) => {
  const repo = mkTempRepo();
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));

  writeSpecFiles(path.join(repo, ".sdd", "specs", "zeta"), ["requirements.md"]);
  writeSpecFiles(path.join(repo, ".sdd", "specs", "alpha"), ["requirements.md"]);

  const found = discoverSpecs(repo);

  assert.deepEqual(
    found.map((f) => path.basename(f.specDir)),
    ["alpha", "zeta"],
  );
});
