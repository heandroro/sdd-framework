import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSpec } from "../src/parser";

test("parseSpec: arquivo vazio não produz seções, IDs ou placeholders", () => {
  const parsed = parseSpec("requirements.md", "requirements", "");

  assert.deepEqual(parsed.sections, []);
  assert.deepEqual(parsed.ids, []);
  assert.deepEqual(parsed.placeholders, []);
});

test("parseSpec: arquivo válido extrai seções e todos os tipos de ID com a linha correta", () => {
  const content = [
    "# Design",
    "",
    "## Requisitos de Observabilidade",
    "",
    "- REQ-1.1: descrição do requisito",
    "- OBS-2: métrica necessária",
    "",
    "## Application Performance Monitor",
    "- APM-M1: contador",
    "- APM-E3: evento",
    "",
    "## Tasks",
    "- T-IMP-01: scaffold",
    "- T-APM-02: métricas",
    "- T-DOC-03: docs",
  ].join("\n");

  const parsed = parseSpec("design.md", "design", content);

  assert.deepEqual(
    parsed.sections.map((s) => `${"#".repeat(s.level)} ${s.title}`),
    [
      "# Design",
      "## Requisitos de Observabilidade",
      "## Application Performance Monitor",
      "## Tasks",
    ],
  );

  assert.deepEqual(
    parsed.ids.map((id) => id.value),
    ["REQ-1.1", "OBS-2", "APM-M1", "APM-E3", "T-IMP-01", "T-APM-02", "T-DOC-03"],
  );

  assert.equal(parsed.ids.find((id) => id.value === "REQ-1.1")?.kind, "REQ");
  assert.equal(parsed.ids.find((id) => id.value === "APM-M1")?.kind, "APM-M");
  assert.equal(parsed.ids.find((id) => id.value === "APM-E3")?.kind, "APM-E");
  assert.equal(parsed.ids.find((id) => id.value === "T-DOC-03")?.kind, "T-DOC");
  assert.equal(parsed.ids.find((id) => id.value === "OBS-2")?.line, 6);
  assert.deepEqual(parsed.placeholders, []);
});

test("parseSpec: captura subseções H3 (necessário para R001 checar cada subseção de observabilidade)", () => {
  const content = [
    "## Requisitos de Observabilidade (Application Performance Monitor)",
    "",
    "### O que precisa ser visível para o time de operações?",
    "- [ ] **[OBS-1]** algo",
    "",
    "### O que precisa ser visível para o time de produto/negócio?",
    "- [ ] **[OBS-2]** algo",
  ].join("\n");

  const parsed = parseSpec("requirements.md", "requirements", content);

  assert.deepEqual(
    parsed.sections.map((s) => ({ level: s.level, title: s.title })),
    [
      { level: 2, title: "Requisitos de Observabilidade (Application Performance Monitor)" },
      { level: 3, title: "O que precisa ser visível para o time de operações?" },
      { level: 3, title: "O que precisa ser visível para o time de produto/negócio?" },
    ],
  );
});

test("parseSpec: detecta [PREENCHER] tanto em item de lista quanto em célula de tabela", () => {
  const content = [
    "## Checklist",
    "- Campo: [PREENCHER]",
    "",
    "| Nome | Valor |",
    "| --- | --- |",
    "| Estilo | [PREENCHER] |",
  ].join("\n");

  const parsed = parseSpec("requirements.md", "requirements", content);

  assert.equal(parsed.placeholders.length, 2);
  assert.deepEqual(
    parsed.placeholders.map((p) => p.line),
    [2, 6],
  );
});

test("parseSpec: ignora IDs e [PREENCHER] citados como exemplo dentro de código inline (crases)", () => {
  const content = [
    "| REQ-1.1 | descrição real do requisito |",
    "| REQ-1.3 | duplicados (ex: dois `REQ-1.1`) |",
    "placeholder `[PREENCHER]` em qualquer campo",
  ].join("\n");

  const parsed = parseSpec("requirements.md", "requirements", content);

  assert.deepEqual(
    parsed.ids.map((id) => `${id.value}@${id.line}`),
    ["REQ-1.1@1", "REQ-1.3@2"],
  );
  assert.deepEqual(parsed.placeholders, []);
});

test("parseSpec: marca declaration=true só quando o ID é célula inteira de tabela ou está em **[ID]**", () => {
  const content = [
    "| APM-M1  | sdd.validator.specs_scanned.count | Counter | total | OBS-1 |",
    "- [ ] **[OBS-2]** item declarado em negrito-colchetes",
    "[x] Métricas (APM-M1..M5) com IDs únicos",
    "OBS-1 → APM-M1..M4 + APM-E1",
  ].join("\n");

  const parsed = parseSpec("design.md", "design", content);

  const byLocation = parsed.ids.map((id) => `${id.value}@${id.line}:${id.declaration}`);

  // Linha 1 (tabela): APM-M1 (1ª célula) e OBS-1 (última célula) são declarações.
  assert.ok(byLocation.includes("APM-M1@1:true"));
  assert.ok(byLocation.includes("OBS-1@1:true"));

  // Linha 2 (**[OBS-2]**): declaração.
  assert.ok(byLocation.includes("OBS-2@2:true"));

  // Linha 3 ("(APM-M1..M5)", fora de tabela): apenas menção.
  assert.ok(byLocation.includes("APM-M1@3:false"));

  // Linha 4 ("OBS-1 → APM-M1..M4 + APM-E1", sem tabela): apenas menções.
  assert.ok(byLocation.includes("OBS-1@4:false"));
  assert.ok(byLocation.includes("APM-M1@4:false"));
  assert.ok(byLocation.includes("APM-E1@4:false"));
});

test("parseSpec: célula de tabela com lista de IDs (ex: 'OBS-1, OBS-4') marca todos como declaração", () => {
  const content = "| APM-E1 | ValidationRun | ... | ... | OBS-1, OBS-4 |";
  const parsed = parseSpec("design.md", "design", content);

  const obsIds = parsed.ids.filter((id) => id.kind === "OBS");
  assert.equal(obsIds.length, 2);
  assert.ok(obsIds.every((id) => id.declaration));
});

test("parseSpec: não deduplica IDs repetidos (deduplicação é responsabilidade das regras)", () => {
  const content = "REQ-1.1 primeira ocorrência\nREQ-1.1 duplicada\n";
  const parsed = parseSpec("requirements.md", "requirements", content);

  assert.equal(parsed.ids.length, 2);
  assert.deepEqual(
    parsed.ids.map((id) => id.line),
    [1, 2],
  );
});
