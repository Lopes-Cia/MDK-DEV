import "server-only";

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

export async function GET(
  _req: NextRequest,
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
  const filePath = path.resolve(tenantRoot, "THEMA", "assets", "images", ...safeParts);
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
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}

