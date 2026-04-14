import { readRequestBinary } from "./body.mjs";
import { json } from "./response.mjs";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

export function buildProxyRequestHeaders(req) {
  const out = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue;
    const key = String(k).toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(key)) continue;
    if (key === "origin" || key === "referer") continue;
    if (key === "accept-encoding") continue;
    out[k] = v;
  }
  out["accept-encoding"] = "identity";
  return out;
}

export function normalizeJoin(baseUrl, pathname, search) {
  const base = String(baseUrl).replace(/\/+$/, "");
  const pathPart = String(pathname ?? "").startsWith("/")
    ? String(pathname ?? "")
    : `/${String(pathname ?? "")}`;
  const query = String(search ?? "");
  return `${base}${pathPart}${query}`;
}

export function filterUpstreamHeaders(upstreamHeaders, cors) {
  const out = {};
  let setCookies = [];

  for (const [k, v] of upstreamHeaders) {
    const key = String(k).toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(key)) continue;
    if (key === "set-cookie") continue;
    out[k] = v;
  }

  if (typeof upstreamHeaders.getSetCookie === "function") {
    setCookies = upstreamHeaders.getSetCookie();
  } else {
    const single = upstreamHeaders.get("set-cookie");
    if (single) setCookies = [single];
  }

  const finalHeaders = { ...out, ...(cors ?? {}) };
  if (setCookies.length) finalHeaders["Set-Cookie"] = setCookies;
  return finalHeaders;
}

export async function proxyToUpstream(req, res, cors, targetUrl) {
  const method = String(req.method ?? "GET").toUpperCase();
  const headers = buildProxyRequestHeaders(req);

  let body;
  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await readRequestBinary(req);
    } catch (e) {
      const message = e instanceof Error ? e.message : "";
      if (message === "payload_too_large") {
        json(res, 413, { error: "payload_too_large" }, cors);
        return;
      }
      json(res, 400, { error: "invalid_body" }, cors);
      return;
    }
  }

  let upstream;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "follow",
    });
  } catch (err) {
    process.stderr.write(
      `[mock-end] Proxy falhou (${method} ${targetUrl}): ${String(err?.message ?? err)}\n`
    );
    json(res, 502, { error: "bad_gateway" }, cors);
    return;
  }

  const finalHeaders = filterUpstreamHeaders(upstream.headers, cors);
  const buf = Buffer.from(await upstream.arrayBuffer());
  res.writeHead(upstream.status, finalHeaders);
  res.end(buf);
}

