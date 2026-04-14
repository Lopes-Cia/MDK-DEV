import fs from "node:fs";
import path from "node:path";

const CWD = process.cwd();
const ROOT = fs.existsSync(path.join(CWD, "adega-lopes")) ? CWD : path.resolve(CWD, "WWW", "MICROSERVICE", "MOCK-END");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function validateTheme({ tenant, themePath, tokensPath }) {
  const theme = readJson(themePath);
  const tokens = readText(tokensPath);

  assert(theme.tenant === tenant, `[${tenant}] theme.tenant inválido`);
  assert(typeof theme.selected === "string", `[${tenant}] theme.selected deve ser string`);
  assert(Array.isArray(theme.options) && theme.options.length >= 1, `[${tenant}] theme.options inválido`);

  const byId = new Map(theme.options.map((o) => [o.id, o]));
  assert(byId.has(theme.selected), `[${tenant}] selected não referencia uma opção existente`);

  const requiredPaletteKeys = [
    "background",
    "surface",
    "text",
    "primary",
    "primaryForeground",
    "accent",
    "accentForeground",
    "border",
    "muted",
  ];

  for (const opt of theme.options) {
    assert(typeof opt.id === "string" && opt.id.length > 0, `[${tenant}] option.id inválido`);
    assert(opt.palette && typeof opt.palette === "object", `[${tenant}] option.palette inválido (${opt.id})`);
    for (const key of requiredPaletteKeys) {
      assert(key in opt.palette, `[${tenant}] palette.${key} ausente (${opt.id})`);
      assert(isHexColor(opt.palette[key]), `[${tenant}] palette.${key} inválido (${opt.id}): ${opt.palette[key]}`);
    }
  }

  const selected = byId.get(theme.selected);
  const expectedVars = [
    "--background",
    "--surface",
    "--text",
    "--primary",
    "--primary-foreground",
    "--accent",
    "--accent-foreground",
    "--border",
    "--muted",
    "--radius",
    "--shadow",
  ];

  for (const v of expectedVars) {
    assert(tokens.includes(`${v}:`), `[${tenant}] tokens.css não contém ${v}`);
  }

  const mustMatch = [
    ["--background", selected.palette.background],
    ["--surface", selected.palette.surface],
    ["--text", selected.palette.text],
    ["--primary", selected.palette.primary],
    ["--primary-foreground", selected.palette.primaryForeground],
    ["--accent", selected.palette.accent],
    ["--accent-foreground", selected.palette.accentForeground],
    ["--border", selected.palette.border],
    ["--muted", selected.palette.muted],
  ];

  for (const [v, val] of mustMatch) {
    assert(tokens.includes(`${v}: ${val}`), `[${tenant}] tokens.css não reflete ${v} do selected (${val})`);
  }

  return { tenant, selected: theme.selected };
}

function main() {
  const tenants = ["adega-lopes", "mercearia-lopes"];
  const results = [];

  for (const tenant of tenants) {
    const themePath = path.join(ROOT, tenant, "THEMA", "theme.json");
    const tokensPath = path.join(ROOT, tenant, "THEMA", "tokens.css");
    results.push(validateTheme({ tenant, themePath, tokensPath }));
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
}

main();
