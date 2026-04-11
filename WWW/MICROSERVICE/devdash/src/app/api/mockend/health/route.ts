import { NextResponse } from "next/server";

function isLocalBaseUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:") return null;
    if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return null;
    const port = Number(url.port || "80");
    if (!Number.isFinite(port) || port <= 0) return null;
    return { baseUrl: `${url.protocol}//${url.hostname}:${port}` };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("baseUrl");
  const configured = isLocalBaseUrl(q ?? process.env.DEVDASH_MOCKEND_BASE_URL ?? "http://localhost:4000");
  if (!configured) return NextResponse.json({ ok: false, error: "invalid_base_url" }, { status: 400 });

  try {
    const res = await fetch(`${configured.baseUrl}/health`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ ok: false, status: res.status });
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    return NextResponse.json({ ok: Boolean(data?.ok), status: res.status });
  } catch {
    return NextResponse.json({ ok: false, status: 0 });
  }
}

