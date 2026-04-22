import fs from "node:fs/promises";
import path from "node:path";
import { createReadStream } from "node:fs";

import { json } from "../lib/response.mjs";

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".ico") return "image/x-icon";
  return "application/octet-stream";
}

function safeResolveUnder(baseDir, requestedPath) {
  const safe = requestedPath.replace(/^\/+/, "").replace(/\\/g, "/");
  const abs = path.resolve(baseDir, safe);
  const baseAbs = path.resolve(baseDir);
  if (!abs.startsWith(baseAbs + path.sep) && abs !== baseAbs) return null;
  return abs;
}

export async function handlePublicAssets(req, res, ctx) {
  const { cors, pathname, rootDir } = ctx;
  if (req.method !== "GET" && req.method !== "HEAD") return false;
  if (!pathname.startsWith("/assets/images/")) return false;

  const produtoName = String(ctx?.produtoName ?? "connect").trim();
  const relative = pathname.slice("/assets/images/".length);
  const baseDir = path.join(rootDir, "PRODUTO", produtoName, "assets", "images");
  const filePath = safeResolveUnder(baseDir, relative);
  if (!filePath) {
    json(res, 400, { error: "bad_path" }, cors);
    return true;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      json(res, 404, { error: "not_found" }, cors);
      return true;
    }
  } catch {
    json(res, 404, { error: "not_found" }, cors);
    return true;
  }

  const headers = {
    "Content-Type": contentTypeFor(filePath),
    "Cache-Control": "no-store",
    ...cors,
  };
  res.writeHead(200, headers);
  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  createReadStream(filePath).pipe(res);
  return true;
}
