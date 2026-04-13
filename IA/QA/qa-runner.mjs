import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function argValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const v = process.argv[idx + 1];
  if (!v || v.startsWith("--")) return fallback;
  return v;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeText(filePath, content) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

function runCmd({ cwd, command, args }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: true,
      windowsHide: true,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString("utf8")));
    child.stderr.on("data", (d) => (err += d.toString("utf8")));
    child.on("close", (code) => resolve({ code: code ?? 0, out, err }));
  });
}

async function httpCheck(url) {
  const started = Date.now();
  try {
    const res = await fetch(url, { cache: "no-store" });
    const ms = Date.now() - started;
    return { ok: res.ok, status: res.status, ms };
  } catch (e) {
    const ms = Date.now() - started;
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, status: 0, ms, error: message };
  }
}

async function tryImportPlaywright() {
  try {
    const mod = await import("playwright");
    return mod;
  } catch {
    return null;
  }
}

async function takeScreenshots({ baseUrl, tenants, outDir }) {
  const pw = await tryImportPlaywright();
  if (!pw) {
    return { ok: false, error: "playwright_not_installed" };
  }

  const { chromium } = pw;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const routes = [
    (t) => `/${t}`,
    (t) => `/${t}/categoria/vinhos`,
    (t) => `/${t}/produto/vinho-tinto`,
    (t) => `/${t}/carrinho`,
    (t) => `/${t}/dashboard/builder`,
  ];

  const results = [];

  for (const tenant of tenants) {
    for (const mk of routes) {
      const route = mk(tenant);
      const url = `${baseUrl.replace(/\/$/, "")}${route}`;
      const page = await context.newPage();

      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      const started = Date.now();
      let status = 0;
      let ok = false;
      let error = null;
      try {
        const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
        status = resp?.status() ?? 0;
        ok = status >= 200 && status < 400;
        const fileName = route.replaceAll("/", "_").replace(/^_+/, "");
        const shotPath = path.join(outDir, "screenshots", tenant, `${fileName || "home"}.png`);
        await ensureDir(path.dirname(shotPath));
        await page.screenshot({ path: shotPath, fullPage: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        error = message;
      } finally {
        await page.close().catch(() => {});
      }

      results.push({
        tenant,
        route,
        url,
        ok,
        status,
        ms: Date.now() - started,
        consoleErrors,
        error,
      });
    }
  }

  await context.close();
  await browser.close();

  return { ok: true, results };
}

async function main() {
  const mode = argValue("--mode", "smoke");
  const mockendUrl = argValue("--mockend", process.env.MOCKEND_URL || "http://localhost:4000");
  const n1Url = argValue("--n1", process.env.N1_URL || "http://localhost:3000");
  const tenantsArg = argValue("--tenants", process.env.TENANTS || "adega-lopes");
  const tenants = tenantsArg.split(",").map((s) => s.trim()).filter(Boolean);

  const stamp = nowStamp();
  const outDir = path.resolve("c:\\LOPES\\www\\MDK-DEV\\IA\\QA\\reports", stamp);
  await ensureDir(outDir);

  const report = {
    stamp,
    mode,
    env: { mockendUrl, n1Url, tenants },
    checks: [],
    runs: [],
    screenshots: null,
  };

  if (mode === "smoke" || mode === "all") {
    report.checks.push({ name: "mockend_health", url: `${mockendUrl}/health`, ...(await httpCheck(`${mockendUrl}/health`)) });
    for (const tenant of tenants) {
      report.checks.push({ name: "n1_home", tenant, url: `${n1Url}/${tenant}`, ...(await httpCheck(`${n1Url}/${tenant}`)) });
      report.checks.push({ name: "n1_builder", tenant, url: `${n1Url}/${tenant}/dashboard/builder`, ...(await httpCheck(`${n1Url}/${tenant}/dashboard/builder`)) });
    }
  }

  if (mode === "imagens" || mode === "all") {
    const runSafe = !hasFlag("--no-safe");
    const scraperDir = path.resolve("c:\\LOPES\\www\\MDK-DEV\\WWW\\MICROSERVICE\\image-scraper");
    const iaDir = path.resolve("c:\\LOPES\\www\\MDK-DEV\\WWW\\MICROSERVICE\\ia-image-generator");

    for (const tenant of tenants) {
      const args = ["src/index.js", "--tenant", tenant, "--mockend", mockendUrl];
      if (!runSafe) args.push("--no-safe");
      const res = await runCmd({ cwd: scraperDir, command: "node", args });
      report.runs.push({ name: "image-scraper", tenant, code: res.code });
      await writeText(path.join(outDir, "logs", `image-scraper_${tenant}.log`), res.out + "\n" + res.err);

      const resIa = await runCmd({ cwd: iaDir, command: "node", args: ["src/index.js", "--tenant", tenant, "--mockend", mockendUrl] });
      report.runs.push({ name: "ia-image-generator", tenant, code: resIa.code });
      await writeText(path.join(outDir, "logs", `ia-image-generator_${tenant}.log`), resIa.out + "\n" + resIa.err);
    }
  }

  if (mode === "n1-qa" || mode === "all") {
    report.screenshots = await takeScreenshots({ baseUrl: n1Url, tenants, outDir });
  }

  const md = [];
  md.push(`# QA Report — ${stamp}`);
  md.push("");
  md.push(`- mode: ${mode}`);
  md.push(`- mockend: ${mockendUrl}`);
  md.push(`- n1: ${n1Url}`);
  md.push(`- tenants: ${tenants.join(", ")}`);
  md.push("");

  if (report.checks.length) {
    md.push("## Smoke");
    for (const c of report.checks) {
      const extra = c.tenant ? ` tenant=${c.tenant}` : "";
      md.push(`- ${c.name}${extra} status=${c.status} ok=${c.ok} ms=${c.ms} url=${c.url}${c.error ? ` error=${c.error}` : ""}`);
    }
    md.push("");
  }

  if (report.runs.length) {
    md.push("## Runs");
    for (const r of report.runs) {
      md.push(`- ${r.name} tenant=${r.tenant} exit=${r.code}`);
    }
    md.push("");
  }

  if (report.screenshots) {
    md.push("## Screenshots");
    if (!report.screenshots.ok) {
      md.push(`- failed: ${report.screenshots.error}`);
    } else {
      for (const r of report.screenshots.results) {
        md.push(`- tenant=${r.tenant} route=${r.route} status=${r.status} ok=${r.ok} ms=${r.ms} consoleErrors=${r.consoleErrors.length}${r.error ? ` error=${r.error}` : ""}`);
      }
    }
    md.push("");
  }

  await writeText(path.join(outDir, "report.md"), md.join("\n"));
  await writeText(path.join(outDir, "report.json"), JSON.stringify(report, null, 2) + "\n");

  process.stdout.write(`QA report saved at ${outDir}\\n`);
}

main().catch((e) => {
  process.stderr.write(String(e) + "\n");
  process.exit(1);
});

