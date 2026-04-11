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
  const configured = isLocalBaseUrl(q ?? process.env.DEVDASH_N1_BASE_URL ?? "http://localhost:3000");
  if (!configured) return NextResponse.json({ ok: false, error: "invalid_base_url" }, { status: 400 });

  try {
    const res = await fetch(`${configured.baseUrl}/`, { cache: "no-store" });
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch {
    return NextResponse.json({ ok: false, status: 0 });
  }
}

