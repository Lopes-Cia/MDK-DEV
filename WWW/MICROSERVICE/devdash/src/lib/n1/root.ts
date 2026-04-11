import "server-only";

import fs from "node:fs";
import path from "node:path";

export function getN1Root() {
  const cwd = process.cwd();

  const candidates = [
    path.resolve(cwd, "..", "..", "n1"),
    path.resolve(cwd, "WWW", "n1"),
    path.resolve(cwd, "n1"),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    if (process.env.DEVDASH_DEBUG === "1") {
      console.log(`[devdash] getN1Root -> ${candidate}`);
    }
    return candidate;
  }

  if (process.env.DEVDASH_DEBUG === "1") {
    console.log(`[devdash] getN1Root (fallback) -> ${candidates[0]}`);
  }
  return candidates[0];
}

