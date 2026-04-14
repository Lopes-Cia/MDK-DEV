function isAllowedOrigin(origin) {
  if (!origin) return false;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  const host = url.hostname;
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  if (port !== "3000") return false;
  if (host === "localhost" || host === "127.0.0.1") return true;
  if (host === "lvh.me" || host.endsWith(".lvh.me")) return true;
  return false;
}

export function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Tenant",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

