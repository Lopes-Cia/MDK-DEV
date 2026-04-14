export function parseCookies(req) {
  const raw = req.headers.cookie;
  if (!raw) return {};
  const out = {};
  for (const part of String(raw).split(";")) {
    const [k, ...rest] = part.split("=");
    const key = k?.trim();
    if (!key) continue;
    out[key] = decodeURIComponent(rest.join("=").trim());
  }
  return out;
}

export function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(String(value))}`];
  if (options.maxAge != null) parts.push(`Max-Age=${Number(options.maxAge)}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

