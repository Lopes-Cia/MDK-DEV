import { spawn } from "node:child_process";
import * as fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { getMockEndRoot } from "@/lib/mockend/root";

type MockEndProcessState = {
  pid: number;
  port: number;
  baseUrl: string;
  startedAt: string;
  logFilePath: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function ensureDevDashDir() {
  const dir = path.resolve(process.cwd(), ".devdash");
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function stateFilePath() {
  const dir = await ensureDevDashDir();
  return path.join(dir, "mockend-process.json");
}

async function startLockFilePath() {
  const dir = await ensureDevDashDir();
  return path.join(dir, "mockend-process.start.lock");
}

async function tryAcquireStartLock() {
  const lockPath = await startLockFilePath();
  try {
    const handle = await fs.open(lockPath, "wx");
    await handle.close();
    return true;
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "EEXIST") return false;
    throw err;
  }
}

async function releaseStartLock() {
  const lockPath = await startLockFilePath();
  await fs.rm(lockPath, { force: true });
}

function isLocalBaseUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:") return null;
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return null;
    const port = Number(url.port || "80");
    if (!Number.isFinite(port) || port <= 0) return null;
    return { baseUrl: `${url.protocol}//${url.hostname}:${port}`, port };
  } catch {
    return null;
  }
}

function isProcessRunning(pid: number) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function readState(): Promise<MockEndProcessState | null> {
  const filePath = await stateFilePath();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(raw) as unknown;
    if (!isRecord(data)) return null;
    const pid = typeof data.pid === "number" ? data.pid : Number(data.pid);
    const port = typeof data.port === "number" ? data.port : Number(data.port);
    const baseUrl = typeof data.baseUrl === "string" ? data.baseUrl : "";
    const startedAt = typeof data.startedAt === "string" ? data.startedAt : "";
    const logFilePath = typeof data.logFilePath === "string" ? data.logFilePath : "";
    if (!pid || !port || !baseUrl || !startedAt || !logFilePath) return null;
    return { pid, port, baseUrl, startedAt, logFilePath };
  } catch {
    return null;
  }
}

async function writeState(state: MockEndProcessState) {
  const filePath = await stateFilePath();
  await fs.writeFile(filePath, JSON.stringify(state, null, 2) + "\n", "utf8");
}

async function clearState() {
  const filePath = await stateFilePath();
  await fs.rm(filePath, { force: true });
}

async function startMockEnd() {
  const configured = isLocalBaseUrl(process.env.DEVDASH_MOCKEND_BASE_URL ?? "http://localhost:4000");
  if (!configured) {
    return NextResponse.json({ ok: false, error: "invalid_base_url" }, { status: 400 });
  }

  const existing = await readState();
  if (existing && isProcessRunning(existing.pid)) {
    return NextResponse.json({ ok: true, status: "already_running", state: existing });
  }

  const locked = !(await tryAcquireStartLock());
  if (locked) {
    const state = await readState();
    const running = state ? isProcessRunning(state.pid) : false;
    if (state && running) return NextResponse.json({ ok: true, status: "already_running", state });
    return NextResponse.json({ ok: true, status: "starting", state: running ? state : null }, { status: 202 });
  }

  if (existing) await clearState();

  const cwd = getMockEndRoot();
  try {
    await fs.access(path.join(cwd, "package.json"));
  } catch {
    await releaseStartLock();
    return NextResponse.json({ ok: false, error: "invalid_cwd", cwd }, { status: 500 });
  }

  const npmCmd = "npm";
  const shell = process.platform === "win32";
  const startedAt = new Date().toISOString();

  const dir = await ensureDevDashDir();
  // Cada start do MOCK-END gera um novo arquivo em `.devdash/` e faz pipe de stdout/stderr do processo
  // para esse arquivo. Se o serviço for iniciado muitas vezes, essa pasta cresce rápido.
  // Ponto ideal para implementar retenção (ex.: manter N arquivos ou apagar por idade).
  const logFilePath = path.join(dir, `mockend-${Date.now()}.log`);
  const logStream = fsSync.createWriteStream(logFilePath, { flags: "a" });

  try {
    let child: ReturnType<typeof spawn>;
    try {
      child = spawn(npmCmd, ["start"], {
        cwd,
        env: { ...process.env, PORT: String(configured.port) },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
        shell,
      });
    } catch (err) {
      const e = err as NodeJS.ErrnoException;
      logStream.write(
        `[devdash] spawn_throw code=${e.code ?? ""} message=${e.message}\n[devdash] cwd=${cwd}\n`,
        "utf8",
      );
      return NextResponse.json(
        { ok: false, error: "spawn_throw", details: { code: e.code, message: e.message }, cwd, logFilePath },
        { status: 500 },
      );
    }

    // Captura logs do processo (stdout/stderr) no arquivo `.devdash/mockend-<timestamp>.log`.
    child.stdout?.pipe(logStream);
    child.stderr?.pipe(logStream);
    child.once("exit", () => logStream.end());
    child.once("error", () => logStream.end());

    const outcome = await new Promise<{ pid: number | null; error: { code?: string; message: string } | null }>(
      (resolve) => {
        child.once("error", (err) => {
          const e = err as NodeJS.ErrnoException;
          resolve({ pid: null, error: { code: e.code, message: e.message } });
        });
        child.once("spawn", () => resolve({ pid: child.pid ?? null, error: null }));
      },
    );

    const state: MockEndProcessState = {
      pid: outcome.pid ?? 0,
      port: configured.port,
      baseUrl: configured.baseUrl,
      startedAt,
      logFilePath,
    };

    if (!state.pid) {
      if (outcome.error) {
        logStream.write(
          `[devdash] spawn_error code=${outcome.error.code ?? ""} message=${outcome.error.message}\n[devdash] cwd=${cwd}\n`,
          "utf8",
        );
      }
      await clearState();
      return NextResponse.json(
        { ok: false, error: "spawn_error", details: outcome.error, cwd, logFilePath },
        { status: 500 },
      );
    }

    await writeState(state);
    return NextResponse.json({ ok: true, status: "started", state });
  } finally {
    await releaseStartLock();
    logStream.end();
  }
}

async function stopMockEnd() {
  const existing = await readState();
  if (!existing) return NextResponse.json({ ok: true, status: "already_stopped" });

  const running = isProcessRunning(existing.pid);
  if (running) {
    try {
      if (process.platform === "win32") {
        await new Promise<void>((resolve, reject) => {
          const killer = spawn("taskkill", ["/PID", String(existing.pid), "/T", "/F"], {
            stdio: "ignore",
            windowsHide: true,
          });
          killer.on("error", reject);
          killer.on("exit", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`taskkill_failed_${code ?? "unknown"}`));
          });
        });
      } else {
        try {
          process.kill(-existing.pid);
        } catch {
          process.kill(existing.pid);
        }
      }
    } catch {
      await clearState();
      return NextResponse.json({ ok: false, error: "stop_failed" }, { status: 500 });
    }
  }

  await clearState();
  return NextResponse.json({ ok: true, status: running ? "stopped" : "not_running" });
}

export async function GET() {
  const state = await readState();
  const running = state ? isProcessRunning(state.pid) : false;
  return NextResponse.json({ ok: true, running, state: running ? state : null });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as unknown;
  const action = isRecord(body) && typeof body.action === "string" ? body.action : "";

  if (action === "start") return await startMockEnd();
  if (action === "stop") return await stopMockEnd();

  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}
