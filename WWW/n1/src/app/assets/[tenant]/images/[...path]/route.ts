import "server-only";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";

import { getMockEndRoot } from "@/lib/mockend/root";
import { isValidTenant } from "@/lib/mockend/tenants";

function contentTypeFromExt(ext: string) {
  switch (ext) {
    case ".webp":
      return "image/webp";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

function isSafeSegment(seg: string) {
  if (!seg) return false;
  if (seg === "." || seg === "..") return false;
  if (seg.includes("\0")) return false;
  return true;
}

function isSha256Hex(s: string) {
  return /^[a-f0-9]{64}$/i.test(s);
}

function parseLazyVariant(parts: string[]) {
  if (parts.length !== 3) return null;
  if (parts[0] !== "derived") return null;
  const sha256 = parts[1] ?? "";
  const file = parts[2] ?? "";
  if (!isSha256Hex(sha256)) return null;
  if (!file.toLowerCase().endsWith(".webp")) return null;
  const variant = path.basename(file, ".webp");
  const allowed = new Set(["zoom", "produto", "card", "thumb"]);
  if (!allowed.has(variant)) return null;
  return { sha256, variant };
}

function getTratamentoImagensBaseUrl() {
  return String(process.env.TRATAMENTO_IMAGENS_BASE_URL ?? "http://localhost:4010").replace(/\/+$/, "");
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ tenant: string; path: string[] }> }
) {
  const { tenant, path: parts } = await ctx.params;
  if (!(await isValidTenant(tenant))) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const safeParts = (Array.isArray(parts) ? parts : []).map((p) => String(p));
  if (!safeParts.length || safeParts.some((p) => !isSafeSegment(p))) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  const ext = path.extname(safeParts[safeParts.length - 1] ?? "").toLowerCase();
  const allowedExts = new Set([".webp", ".png", ".jpg", ".jpeg", ".gif", ".svg"]);
  if (!allowedExts.has(ext)) {
    return NextResponse.json({ error: "invalid_ext" }, { status: 400 });
  }

  const root = getMockEndRoot();
  const tenantRoot = path.resolve(root, tenant);
  const candidates = [
    path.resolve(tenantRoot, "THEMA", "assets", "images", ...safeParts),
    path.resolve(tenantRoot, "COMMERCE", "assets", "images", ...safeParts),
  ];
  for (const filePath of candidates) {
    if (!filePath.startsWith(tenantRoot + path.sep)) {
      return NextResponse.json({ error: "invalid_path" }, { status: 400 });
    }
    try {
      const buf = await fs.readFile(filePath);
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": contentTypeFromExt(ext),
          "Cache-Control": "public, max-age=300",
        },
      });
    } catch {}
  }

  const lazy = ext === ".webp" ? parseLazyVariant(safeParts) : null;
  if (!lazy) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const baseUrl = getTratamentoImagensBaseUrl();
    const correlationId = req.headers.get("x-correlation-id") ?? crypto.randomUUID();
    const url = `${baseUrl}/api/images/variants/${lazy.sha256}/${lazy.variant}?tenant=${encodeURIComponent(tenant)}`;
    const r = await fetch(url, {
      headers: {
        "x-correlation-id": correlationId,
      },
      cache: "no-store",
    });
    if (!r.ok || !r.body) {
      const status = r.status === 404 ? 404 : 502;
      return NextResponse.json({ error: status === 404 ? "not_found" : "lazy_failed" }, { status });
    }
    return new NextResponse(r.body, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "lazy_failed" }, { status: 502 });
  }
}
