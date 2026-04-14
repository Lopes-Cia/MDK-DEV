import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { json, text } from "../lib/response.mjs";

const MAX_UPLOAD_BYTES = 12_000_000; // limite defensivo (original é 10MB no TRATAMENTO-IMAGENS)

const ALLOWED_ORIGINAL_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif", "tif", "tiff", "avif"]);
const ALLOWED_VARIANTS = new Set(["zoom", "produto", "card", "thumb"]);

function sanitizeTenant(raw) {
  const t = String(raw ?? "").trim();
  if (!t) return null;
  // tenant como "slug" simples (evita traversal e paths estranhos)
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/i.test(t)) return null;
  return t;
}

function normalizeRestPath(raw) {
  let p = String(raw ?? "");
  if (!p) return null;
  p = p.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!p) return null;

  const parts = p.split("/").filter(Boolean);
  if (!parts.length) return null;
  if (parts.some((s) => s === "." || s === "..")) return null;
  if (parts.some((s) => s.includes("\0"))) return null;
  // Windows: evita "C:" / "D:" etc
  if (parts.some((s) => s.includes(":"))) return null;

  return parts.join("/");
}

function resolveSafe(baseDir, restPosix) {
  const parts = restPosix.split("/").filter(Boolean);
  const full = path.resolve(baseDir, ...parts);
  const rel = path.relative(baseDir, full);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return full;
}

function contentTypeByExt(ext) {
  const e = String(ext ?? "").toLowerCase();
  if (e === "jpg" || e === "jpeg") return "image/jpeg";
  if (e === "png") return "image/png";
  if (e === "webp") return "image/webp";
  if (e === "gif") return "image/gif";
  if (e === "tif" || e === "tiff") return "image/tiff";
  if (e === "avif") return "image/avif";
  if (e === "json") return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function validateAssetRest(restPosix) {
  const parts = restPosix.split("/").filter(Boolean);
  const top = parts[0];
  if (top === "originals") {
    if (parts.length !== 2) return null;
    const filename = parts[1];
    const m = /^([0-9a-f]{64})\.([a-z0-9]+)$/i.exec(filename);
    if (!m) return null;
    const ext = String(m[2]).toLowerCase();
    if (!ALLOWED_ORIGINAL_EXTS.has(ext)) return null;
    return { kind: "binary", ext };
  }
  if (top === "derived") {
    if (parts.length !== 3) return null;
    const sha = parts[1];
    if (!/^[0-9a-f]{64}$/i.test(sha)) return null;
    const filename = parts[2];
    const m = /^([a-z0-9_-]+)\.webp$/i.exec(filename);
    if (!m) return null;
    const variant = String(m[1]).toLowerCase();
    if (!ALLOWED_VARIANTS.has(variant)) return null;
    return { kind: "binary", ext: "webp" };
  }
  if (top === "manifests") {
    if (parts.length !== 2) return null;
    const filename = parts[1];
    if (!/^[0-9a-f]{64}\.json$/i.test(filename)) return null;
    return { kind: "manifest", ext: "json" };
  }
  return null;
}

async function streamToFileWithLimit(req, targetPath) {
  await fsp.mkdir(path.dirname(targetPath), { recursive: true });
  const tmpPath = `${targetPath}.uploading.${Date.now()}.${Math.random().toString(16).slice(2)}`;

  let total = 0;
  try {
    await new Promise((resolve, reject) => {
      const out = fs.createWriteStream(tmpPath, { flags: "w" });
      const onError = (err) => reject(err);
      out.on("error", onError);
      req.on("error", onError);

      req.on("data", (chunk) => {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += buf.length;
        if (total > MAX_UPLOAD_BYTES) {
          reject(new Error("payload_too_large"));
          req.destroy();
          out.destroy();
        }
      });

      out.on("close", resolve);
      req.pipe(out);
    });
  } catch (e) {
    try {
      await fsp.unlink(tmpPath);
    } catch {
      // ignore
    }
    throw e;
  }

  await fsp.rename(tmpPath, targetPath);
  return total;
}

async function sendFile(req, res, filePath, cors) {
  try {
    const stat = await fsp.stat(filePath);
    const ext = path.extname(filePath).slice(1);
    res.writeHead(200, {
      "Content-Type": contentTypeByExt(ext),
      "Content-Length": String(stat.size),
      "Cache-Control": "no-store",
      ...cors,
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  } catch {
    json(res, 404, { error: "not_found" }, cors);
  }
}

export async function handleStorageImages(req, res, ctx) {
  const { cors, pathname } = ctx;
  if (!pathname.startsWith("/api/storage/")) return false;

  // /api/storage/:tenant/images/<rest...>
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 5) {
    json(res, 404, { error: "not_found" }, cors);
    return true;
  }
  const tenant = sanitizeTenant(parts[2]);
  const kind = parts[3];
  if (!tenant || kind !== "images") {
    json(res, 400, { error: "invalid_request" }, cors);
    return true;
  }

  const restRaw = parts.slice(4).join("/");
  const rest = normalizeRestPath(restRaw);
  if (!rest) {
    json(res, 400, { error: "invalid_path" }, cors);
    return true;
  }

  const asset = validateAssetRest(rest);
  if (!asset) {
    json(res, 403, { error: "path_not_allowed" }, cors);
    return true;
  }

  const baseDir = path.resolve(ctx.rootDir, tenant, "COMMERCE", "assets", "images");
  const filePath = resolveSafe(baseDir, rest);
  if (!filePath) {
    json(res, 403, { error: "path_not_allowed" }, cors);
    return true;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    await sendFile(req, res, filePath, cors);
    return true;
  }

  if (req.method !== "PUT" && req.method !== "POST") {
    text(res, 405, "method_not_allowed", cors);
    return true;
  }

  if (asset.kind === "manifest") {
    // manifest é JSON: valida e grava "pretty"
    const chunks = [];
    let total = 0;
    for await (const chunk of req) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += buf.length;
      if (total > MAX_UPLOAD_BYTES) {
        json(res, 413, { error: "payload_too_large" }, cors);
        return true;
      }
      chunks.push(buf);
    }
    let obj;
    try {
      obj = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      json(res, 400, { error: "invalid_json" }, cors);
      return true;
    }
    await fsp.mkdir(path.dirname(filePath), { recursive: true });
    const pretty = JSON.stringify(obj, null, 2) + "\n";
    await fsp.writeFile(filePath, pretty, "utf8");
    json(res, 200, { ok: true, path: rest, bytes: Buffer.byteLength(pretty) }, cors);
    return true;
  }

  // binário
  try {
    const bytes = await streamToFileWithLimit(req, filePath);
    json(res, 200, { ok: true, path: rest, bytes }, cors);
    return true;
  } catch (err) {
    if (String(err?.message) === "payload_too_large") {
      json(res, 413, { error: "payload_too_large" }, cors);
      return true;
    }
    json(res, 500, { error: "write_failed" }, cors);
    return true;
  }
}
