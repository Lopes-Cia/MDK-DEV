import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function safeString(value) {
  return String(value ?? "").trim();
}

function getArg(i, fallback = "") {
  const v = process.argv[i];
  return v == null ? fallback : String(v);
}

function toLowerSafe(value) {
  return safeString(value).toLowerCase();
}

function listOperationMethods(pathItem) {
  const allowed = new Set(["get", "post", "put", "delete", "patch", "options", "head"]);
  return Object.keys(pathItem ?? {}).filter((k) => allowed.has(k.toLowerCase()));
}

function includesLoose(haystack, needle) {
  const h = toLowerSafe(haystack);
  const n = toLowerSafe(needle);
  if (!n) return false;
  return h.includes(n);
}

async function loadSpec(specPath) {
  const raw = await readFile(specPath, "utf8");
  return JSON.parse(raw);
}

function printHelp() {
  process.stdout.write(
    [
      "Uso:",
      "  node openapi-cli.mjs list-tags",
      "  node openapi-cli.mjs list-all",
      '  node openapi-cli.mjs search "<keyword>"',
      '  node openapi-cli.mjs detail "<path>" [method]',
      "",
      "Notas:",
      "- O spec default e ./api-docs.json (mesma pasta do script).",
      "- list-all imprime: METHOD <path> | tags: ... | operationId: ...",
      "",
    ].join("\n")
  );
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const defaultSpecPath = path.join(__dirname, "api-docs.json");

  const command = toLowerSafe(getArg(2));
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return;
  }

  const spec = await loadSpec(defaultSpecPath);

  if (command === "list-tags") {
    const tags = Array.isArray(spec.tags) ? spec.tags : [];
    for (const t of tags) {
      const name = safeString(t?.name);
      const desc = safeString(t?.description);
      process.stdout.write(`- ${name}${desc ? ` — ${desc}` : ""}\n`);
    }
    return;
  }

  if (command === "list-all") {
    const paths = spec.paths ?? {};
    const lines = [];
    for (const p of Object.keys(paths).sort()) {
      const pathItem = paths[p];
      const methods = listOperationMethods(pathItem);
      for (const m of methods.sort()) {
        const op = pathItem[m];
        const tags = Array.isArray(op?.tags) ? op.tags.join(", ") : "";
        const operationId = safeString(op?.operationId);
        lines.push(
          `${m.toUpperCase()} ${p}` +
            (tags ? ` | tags: ${tags}` : "") +
            (operationId ? ` | operationId: ${operationId}` : "")
        );
      }
    }
    for (const line of lines) process.stdout.write(`${line}\n`);
    return;
  }

  if (command === "search") {
    const q = safeString(getArg(3));
    if (!q) {
      process.stderr.write("search precisa de um keyword.\n");
      process.exitCode = 1;
      return;
    }
    const paths = spec.paths ?? {};
    const hits = [];
    for (const p of Object.keys(paths)) {
      const pathItem = paths[p];
      const methods = listOperationMethods(pathItem);
      for (const m of methods) {
        const op = pathItem[m];
        const tags = Array.isArray(op?.tags) ? op.tags.join(", ") : "";
        const operationId = safeString(op?.operationId);
        const description = safeString(op?.description);
        const summary = safeString(op?.summary);
        const hay = `${m} ${p} ${tags} ${operationId} ${summary} ${description}`;
        if (includesLoose(hay, q)) {
          hits.push(
            `${m.toUpperCase()} ${p}` +
              (tags ? ` | tags: ${tags}` : "") +
              (operationId ? ` | operationId: ${operationId}` : "")
          );
        }
      }
    }
    for (const line of hits.sort()) process.stdout.write(`${line}\n`);
    return;
  }

  if (command === "detail") {
    const p = safeString(getArg(3));
    const method = toLowerSafe(getArg(4));
    if (!p) {
      process.stderr.write('detail precisa de um path, ex: "/webservice/integration/getListProdutoLoja"\n');
      process.exitCode = 1;
      return;
    }

    const pathItem = spec.paths?.[p];
    if (!pathItem) {
      process.stderr.write(`path_not_found: ${p}\n`);
      process.exitCode = 1;
      return;
    }

    const methods = listOperationMethods(pathItem);
    const pickMethod = method || (methods.length === 1 ? methods[0] : "");
    if (!pickMethod) {
      process.stderr.write(`Escolha um method: ${methods.join(", ")}\n`);
      process.exitCode = 1;
      return;
    }

    const op = pathItem[pickMethod];
    if (!op) {
      process.stderr.write(`method_not_found: ${pickMethod}\n`);
      process.exitCode = 1;
      return;
    }

    process.stdout.write(`${JSON.stringify({ path: p, method: pickMethod, operation: op }, null, 2)}\n`);
    return;
  }

  process.stderr.write(`Comando desconhecido: ${command}\n`);
  printHelp();
  process.exitCode = 1;
}

main().catch((err) => {
  process.stderr.write(`${err?.message ?? err}\n`);
  process.exitCode = 1;
});

