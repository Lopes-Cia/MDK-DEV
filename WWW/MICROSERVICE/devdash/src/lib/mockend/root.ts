import "server-only";

import fs from "node:fs";
import path from "node:path";

export function getMockEndRoot() {
  const cwd = process.cwd();

  const candidates = [
    path.resolve(cwd, "..", "MOCK-END"),
    path.resolve(cwd, "..", "mock-end"),
    path.resolve(cwd, "WWW", "MICROSERVICE", "MOCK-END"),
    path.resolve(cwd, "WWW", "MICROSERVICE", "mock-end"),
  ];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    if (process.env.DEVDASH_DEBUG === "1") {
      console.log(`[devdash] getMockEndRoot -> ${candidate}`);
    }
    return candidate;
  }

  if (process.env.DEVDASH_DEBUG === "1") {
    console.log(`[devdash] getMockEndRoot (fallback) -> ${candidates[0]}`);
  }
  return candidates[0];
}
