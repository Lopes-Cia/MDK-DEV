import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseEnv(raw) {
  const out = {};
  const lines = String(raw ?? "").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }

  return out;
}

function toNumber(value, fieldName) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`Valor invalido para ${fieldName}: "${value}"`);
  }
  return n;
}

function getCliArgValue(flagName) {
  const prefix = `${flagName}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  if (!arg) return "";
  return arg.slice(prefix.length).trim();
}

function hasCliFlag(flagName) {
  return process.argv.includes(flagName);
}

async function readPersistedToken(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function persistToken(filePath, content) {
  await writeFile(filePath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envPath = path.join(__dirname, ".env");
  const tokenFilePath = path.join(__dirname, "token-acesso.json");

  const rawEnv = await readFile(envPath, "utf8");
  const env = parseEnv(rawEnv);
  const persisted = await readPersistedToken(tokenFilePath);

  const baseUrl = String(env.AUTH_BASE_URL ?? "").trim();
  if (!baseUrl) {
    throw new Error("AUTH_BASE_URL nao encontrado no .env");
  }

  const refreshTokenArg = getCliArgValue("--refresh-token");
  const useRefreshMode = hasCliFlag("--refresh") || Boolean(refreshTokenArg);
  const refreshToken =
    refreshTokenArg ||
    String(env.REFRESH_TOKEN ?? "").trim() ||
    String(persisted?.refreshToken ?? "").trim();

  let payload;
  let mode;
  if (useRefreshMode) {
    if (!refreshToken) {
      throw new Error(
        "Refresh solicitado, mas nenhum refreshToken foi encontrado. Use --refresh-token=... ou REFRESH_TOKEN no .env."
      );
    }
    payload = { refreshToken };
    mode = "refresh";
  } else {
    const produto = String(env.PRODUTO ?? "").replace(/^["']|["']$/g, "").trim();
    const ean = String(env.EAN ?? "").trim();
    const idIntegradora = toNumber(env.IDINTEGRADORA, "IDINTEGRADORA");
    const codCli = toNumber(env.CODCLI, "CODCLI");
    payload = { produto, ean, idIntegradora, codCli };
    mode = "geracao";
  }

  const target = `${baseUrl.replace(/\/+$/, "")}/tokenService`;
  const res = await fetch(target, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    console.error("Erro ao gerar token:", {
      status: res.status,
      statusText: res.statusText,
      mode,
      response: data,
    });
    process.exitCode = 1;
    return;
  }

  const persistedContent = {
    updatedAt: new Date().toISOString(),
    mode,
    endpoint: target,
    hashToken: data?.hashToken ?? null,
    refreshToken: data?.refreshToken ?? (mode === "refresh" ? payload.refreshToken : null),
    dtExpira: data?.dtExpira ?? null,
    response: data,
  };
  await persistToken(tokenFilePath, persistedContent);

  console.log(`Resposta /tokenService (${mode}):`);
  console.log(JSON.stringify(data, null, 2));
  console.log(`\nToken persistido em: ${tokenFilePath}`);

  if (data?.hashToken) {
    console.log("\nTOKEN (hashToken):");
    console.log(data.hashToken);
  } else {
    console.warn('\nA resposta nao trouxe "hashToken".');
  }
}

main().catch((err) => {
  console.error("Falha ao gerar token:", err?.message ?? err);
  process.exitCode = 1;
});
