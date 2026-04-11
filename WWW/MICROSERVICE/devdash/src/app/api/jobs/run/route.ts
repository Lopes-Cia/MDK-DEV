import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { ALLOWED_JOB_SCRIPTS, type AllowedJobScript } from "@/lib/jobs/allowlist";
import { getMockEndRoot } from "@/lib/mockend/root";

function isAllowedScript(value: unknown): value is AllowedJobScript {
  return typeof value === "string" && (ALLOWED_JOB_SCRIPTS as readonly string[]).includes(value);
}

async function ensureLogDir() {
  const dir = path.resolve(process.cwd(), ".devdash", "logs");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  let script: AllowedJobScript | null = null;

  try {
    const body = (await req.json()) as { script?: unknown };
    if (!isAllowedScript(body?.script)) {
      return NextResponse.json(
        { ok: false, error: "script_not_allowed", allowed: ALLOWED_JOB_SCRIPTS },
        { status: 400 },
      );
    }
    script = body.script;

    const cwd = getMockEndRoot();

    const npmCmd = "npm";
    const shell = process.platform === "win32";
    const child = spawn(npmCmd, ["run", script], {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
      shell,
    });

    let stdout = "";
    let stderr = "";
    const MAX = 200_000;
    const push = (target: "stdout" | "stderr", chunk: Buffer) => {
      const text = chunk.toString("utf8");
      if (target === "stdout") stdout = (stdout + text).slice(-MAX);
      else stderr = (stderr + text).slice(-MAX);
    };

    child.stdout?.on("data", (c) => push("stdout", c as Buffer));
    child.stderr?.on("data", (c) => push("stderr", c as Buffer));

    const exitCode: number = await new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("close", (code) => resolve(code ?? -1));
    });

    const endedAt = Date.now();
    const durationMs = endedAt - startedAt;

    const logDir = await ensureLogDir();
    // Cada execução de job cria um arquivo novo em `.devdash/logs/`.
    // Se rodar scripts com frequência, essa pasta vai crescer indefinidamente.
    // Ponto ideal para implementar retenção (ex.: manter N arquivos ou apagar por idade).
    const logFileName = `${startedAt}-${script.replaceAll(":", "_")}.log`;
    const logFilePath = path.join(logDir, logFileName);
    const logBody = [
      `script: ${script}`,
      `cwd: ${cwd}`,
      `startedAt: ${new Date(startedAt).toISOString()}`,
      `endedAt: ${new Date(endedAt).toISOString()}`,
      `exitCode: ${exitCode}`,
      "",
      "----- stdout -----",
      stdout.trimEnd(),
      "",
      "----- stderr -----",
      stderr.trimEnd(),
      "",
    ].join("\n");
    await fs.writeFile(logFilePath, logBody, "utf8");

    return NextResponse.json({
      ok: exitCode === 0,
      script,
      exitCode,
      durationMs,
      stdout,
      stderr,
      logFilePath,
    });
  } catch {
    const endedAt = Date.now();
    return NextResponse.json(
      {
        ok: false,
        error: "job_run_failed",
        script,
        durationMs: endedAt - startedAt,
      },
      { status: 500 },
    );
  }
}
