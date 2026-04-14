import path from "node:path";

// Mapeamento de bases HTTP -> projeto em PROJETOS/.
// A base define qual pasta (projectDir) contém .env, routes.mjs e handlers.
const BASE_PROJECTS = [
  {
    basePrefix: "/ApiLopes/webservice/api",
    projectSegments: ["ApiLopes", "webservice", "api"],
  },
  {
    basePrefix: "/connect",
    projectSegments: ["connect"],
  },
];

export function resolveProjectByPathname(rootDir, pathname) {
  const p = String(pathname ?? "");
  for (const base of BASE_PROJECTS) {
    const prefix = base.basePrefix;
    if (p === prefix || p.startsWith(`${prefix}/`)) {
      return {
        basePrefix: prefix,
        projectDir: path.join(rootDir, "PROJETOS", ...base.projectSegments),
      };
    }
  }
  return null;
}
