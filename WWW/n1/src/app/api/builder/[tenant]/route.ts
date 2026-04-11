import { NextResponse, type NextRequest } from "next/server";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { getMockEndRoot } from "@/lib/mockend/root";
import { isValidTenant } from "@/lib/mockend/tenants";
import { readTenantJson } from "@/lib/mockend/read";

type PuckContentItem = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

type PuckData = {
  root: { props: Record<string, unknown> };
  content: PuckContentItem[];
};

type BuilderApiGetResponse = {
  tenantId: string;
  urlPath: string;
  data: PuckData;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function resolveByPath(obj: unknown, keyPath: string) {
  const parts = keyPath.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (!isRecord(cur)) return undefined;
    if (!(p in cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

function normalizeBlocks(layout: unknown, copy: unknown): PuckContentItem[] {
  if (!Array.isArray(layout)) return [];

  return layout.map((block) => {
    const blockObj = isRecord(block) ? block : {};
    const idRaw = blockObj.id;
    const id = typeof idRaw === "string" && idRaw ? idRaw : crypto.randomUUID();
    const typeRaw = blockObj.type;
    const type = typeof typeRaw === "string" ? typeRaw : String(typeRaw ?? "");

    const propsRaw = isRecord(blockObj.props) ? blockObj.props : {};
    const props: Record<string, unknown> = { ...propsRaw };

    for (const [k, v] of Object.entries(propsRaw)) {
      if (k.endsWith("Key") && typeof v === "string") {
        const resolved = resolveByPath(copy, v);
        const outKey = k.slice(0, -3);
        if (typeof resolved === "string") props[outKey] = resolved;
        delete props[k];
      }
    }

    return { id, type, props };
  });
}

async function readBuilderFile(tenant: string) {
  const root = getMockEndRoot();
  const filePath = path.join(root, tenant, "BUILDER", "pages.json");
  const raw = await fs.readFile(filePath, "utf8");
  return { filePath, json: JSON.parse(raw) as unknown };
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!(await isValidTenant(tenant))) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const urlPath = url.searchParams.get("path") ?? "/";
  if (!urlPath.startsWith("/")) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  const copy = await readTenantJson<Record<string, unknown>>(tenant, ["COPY", "copy.json"]);
  const { json } = await readBuilderFile(tenant);

  const pagesRaw = isRecord(json) ? json.pages : undefined;
  const pages = Array.isArray(pagesRaw) ? pagesRaw : [];
  const page =
    pages.find((p) => isRecord(p) && p.urlPath === urlPath) ??
    pages.find((p) => isRecord(p) && typeof p.urlPath === "string") ??
    null;

  const layout = isRecord(page) ? page.layout : undefined;
  const content = normalizeBlocks(layout, copy);

  const response: BuilderApiGetResponse = {
    tenantId: tenant,
    urlPath,
    data: { root: { props: {} }, content },
  };

  return NextResponse.json(response, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await ctx.params;
  if (!(await isValidTenant(tenant))) {
    return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as unknown;
  if (!isRecord(body)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const urlPath = typeof body.urlPath === "string" ? body.urlPath : "/";
  const data = isRecord(body.data) ? body.data : null;
  const contentRaw = data ? data.content : null;
  if (!urlPath.startsWith("/") || !Array.isArray(contentRaw)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const normalized = contentRaw.map((block) => {
    const b = isRecord(block) ? block : {};
    const id = typeof b.id === "string" && b.id ? b.id : crypto.randomUUID();
    const type = typeof b.type === "string" ? b.type : String(b.type ?? "");
    const props = isRecord(b.props) ? b.props : {};
    return { id, type, props };
  });

  const { filePath, json } = await readBuilderFile(tenant);
  const pagesRaw = isRecord(json) ? json.pages : undefined;
  const pages = Array.isArray(pagesRaw) ? pagesRaw : [];
  const idx = pages.findIndex((p) => isRecord(p) && p.urlPath === urlPath);
  if (idx === -1) {
    pages.push({ urlPath, kind: "page", layout: normalized });
  } else {
    const current = isRecord(pages[idx]) ? pages[idx] : {};
    pages[idx] = { ...current, layout: normalized };
  }
  const out = isRecord(json) ? { ...json, pages } : { pages };

  await fs.writeFile(filePath, JSON.stringify(out, null, 2) + "\n", "utf8");
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}

