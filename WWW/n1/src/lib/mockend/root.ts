import "server-only";

import fs from "node:fs";
import path from "node:path";

export function getMockEndRoot() {
  const cwd = process.cwd();

  const candidateFromN1 = path.resolve(cwd, "..", "MICROSERVICE", "MOCK-END");
  if (fs.existsSync(candidateFromN1)) return candidateFromN1;

  const candidateFromRepo = path.resolve(cwd, "WWW", "MICROSERVICE", "MOCK-END");
  if (fs.existsSync(candidateFromRepo)) return candidateFromRepo;

  return candidateFromN1;
}

