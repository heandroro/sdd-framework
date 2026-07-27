import fs from "node:fs";
import path from "node:path";
import type { SpecType } from "./types";

const SPEC_FILENAMES: Record<SpecType, string> = {
  requirements: "requirements.md",
  design: "design.md",
  tasks: "tasks.md",
};

const TEMPLATE_DIR_NAME = "_template";

export interface DiscoveredFile {
  specDir: string;
  type: SpecType;
  path: string;
}

function filesInDir(dir: string): DiscoveredFile[] {
  const found: DiscoveredFile[] = [];
  for (const [type, filename] of Object.entries(SPEC_FILENAMES) as [SpecType, string][]) {
    const filePath = path.join(dir, filename);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      found.push({ specDir: dir, type, path: filePath });
    }
  }
  return found;
}

function isSpecDir(dir: string): boolean {
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory() && filesInDir(dir).length > 0;
}

/**
 * Descobre arquivos de spec (requirements/design/tasks.md) a partir de um
 * diretório-alvo. Dois modos:
 *
 *  - `targetDir` já É uma pasta de spec (contém pelo menos um dos três
 *    arquivos): valida só essa pasta diretamente — mesmo que se chame
 *    `_template`. A exclusão de `_template` só se aplica ao varrer
 *    `.sdd/specs/*` (modo abaixo), não quando o alvo é explícito.
 *  - caso contrário, varre `<targetDir>/.sdd/specs/*`, ignorando `_template`;
 *    se `.sdd/specs` não existir, retorna lista vazia sem erro (REQ-2.3).
 */
export function discoverSpecs(targetDir: string): DiscoveredFile[] {
  if (isSpecDir(targetDir)) {
    return filesInDir(targetDir);
  }

  const specsRoot = path.join(targetDir, ".sdd", "specs");
  if (!fs.existsSync(specsRoot) || !fs.statSync(specsRoot).isDirectory()) {
    return [];
  }

  const entries = fs
    .readdirSync(specsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== TEMPLATE_DIR_NAME)
    .sort((a, b) => a.name.localeCompare(b.name));

  const discovered: DiscoveredFile[] = [];
  for (const entry of entries) {
    discovered.push(...filesInDir(path.join(specsRoot, entry.name)));
  }
  return discovered;
}
