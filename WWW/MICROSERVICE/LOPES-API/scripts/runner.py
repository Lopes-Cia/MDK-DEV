#!/usr/bin/env python3

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_ENV_FILE = PROJECT_DIR / ".env.local"
DEFAULT_ENDPOINTS_FILE = PROJECT_DIR / "requests.json"
DEFAULT_RUNS_DIR = PROJECT_DIR / "runs"


def safe_str(v):
    return str(v or "").strip()


def read_env_file(path: Path):
    if not path.exists():
        return {}
    out = {}
    for raw in path.read_text("utf-8").splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        key = k.strip()
        val = v.strip()
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        out[key] = val
    return out


def load_env(env_file: Path):
    file_env = read_env_file(env_file)
    merged = dict(os.environ)
    for k, v in file_env.items():
        merged[k] = v
    return merged


def is_sensitive_key(key: str):
    k = safe_str(key).upper()
    if k == "AUTHORIZATION":
        return True
    for part in ("TOKEN", "SECRET", "PASSWORD", "KEY"):
        if part in k:
            return True
    return False


def redact_value(value: str):
    if not safe_str(value):
        return value
    return "<redacted>"


def redact_headers(headers: dict):
    out = {}
    for k, v in (headers or {}).items():
        if is_sensitive_key(k):
            out[k] = redact_value(v)
        else:
            out[k] = v
    return out


def parse_kv_list(items):
    out = {}
    for item in items or []:
        if "=" not in item:
            raise ValueError(f"Formato inválido: {item} (use k=v)")
        k, v = item.split("=", 1)
        out[safe_str(k)] = safe_str(v)
    return out


def parse_header_list(items):
    out = {}
    for item in items or []:
        if ":" not in item:
            raise ValueError(f"Formato inválido: {item} (use 'Header: valor')")
        k, v = item.split(":", 1)
        out[safe_str(k)] = safe_str(v)
    return out


def add_query(url: str, query: dict):
    if not query:
        return url
    u = urllib.parse.urlsplit(url)
    existing = urllib.parse.parse_qs(u.query, keep_blank_values=True)
    for k, v in query.items():
        existing[k] = [v]
    new_qs = urllib.parse.urlencode(existing, doseq=True)
    return urllib.parse.urlunsplit((u.scheme, u.netloc, u.path, new_qs, u.fragment))


def http_request(method: str, url: str, headers: dict, body_bytes, timeout_s: int):
    req = urllib.request.Request(url, data=body_bytes, method=method.upper())
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    started = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:
            raw = resp.read()
            duration_ms = int((time.time() - started) * 1000)
            return {
                "ok": True,
                "status": resp.status,
                "headers": dict(resp.headers.items()),
                "content_type": resp.headers.get("content-type", ""),
                "body_bytes": raw,
                "duration_ms": duration_ms,
            }
    except urllib.error.HTTPError as e:
        raw = e.read() if hasattr(e, "read") else b""
        duration_ms = int((time.time() - started) * 1000)
        return {
            "ok": False,
            "status": int(getattr(e, "code", 0) or 0),
            "headers": dict(getattr(e, "headers", {}).items()) if getattr(e, "headers", None) else {},
            "content_type": safe_str(getattr(getattr(e, "headers", None), "get", lambda *_: "")("content-type")),
            "body_bytes": raw,
            "duration_ms": duration_ms,
            "error": safe_str(e),
        }
    except Exception as e:
        duration_ms = int((time.time() - started) * 1000)
        return {
            "ok": False,
            "status": 0,
            "headers": {},
            "content_type": "",
            "body_bytes": b"",
            "duration_ms": duration_ms,
            "error": safe_str(e),
        }


def try_parse_json_bytes(b: bytes):
    try:
        return json.loads(b.decode("utf-8", errors="replace"))
    except Exception:
        return None


def format_body_for_print(content_type: str, body_bytes: bytes, max_chars: int, full_body: bool):
    text = body_bytes.decode("utf-8", errors="replace")
    if "application/json" in safe_str(content_type).lower():
        parsed = try_parse_json_bytes(body_bytes)
        if parsed is not None:
            text = json.dumps(parsed, ensure_ascii=False, indent=2)
    if full_body:
        return text
    if max_chars <= 0:
        return ""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n...\n"

def bytes_to_text_snippet(b: bytes, max_chars: int = 1000):
    if not b:
        return ""
    s = b.decode("utf-8", errors="replace")
    if max_chars <= 0:
        return ""
    if len(s) <= max_chars:
        return s
    return s[:max_chars] + "\n...\n"

def now_iso_z():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

def now_compact_z():
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def resolve_base_url(env: dict, base_var: str):
    v = safe_str(env.get(base_var))
    if not v:
        raise ValueError(f"{base_var} não encontrado no ambiente")
    return v.rstrip("/")


def join_url(base: str, path: str):
    b = safe_str(base).rstrip("/")
    p = safe_str(path)
    if not p.startswith("/"):
        p = "/" + p
    return b + p


def token_service_get(env: dict, timeout_s: int):
    auth_base = safe_str(env.get("AUTH_BASE_URL")).rstrip("/")
    if not auth_base:
        auth_base = "https://gp.lopesecia.com.br:9002/ApiLopes"
    url = join_url(auth_base, "/webservice/api/tokenService")
    produto = safe_str(env.get("PRODUTO")) or "CONNECT"
    ean = env.get("EAN")
    id_integradora = env.get("IDINTEGRADORA")
    cod_cli = env.get("CODCLI")
    payload = {
        "produto": produto,
        "ean": int(ean) if ean is not None and safe_str(ean) else None,
        "idIntegradora": int(id_integradora) if id_integradora is not None and safe_str(id_integradora) else None,
        "codCli": int(cod_cli) if cod_cli is not None and safe_str(cod_cli) else None,
    }
    if payload["ean"] is None or payload["idIntegradora"] is None or payload["codCli"] is None:
        raise ValueError("EAN, IDINTEGRADORA e CODCLI são obrigatórios para gerar token")
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    res = http_request("POST", url, headers, json.dumps(payload).encode("utf-8"), timeout_s)
    data = try_parse_json_bytes(res["body_bytes"])
    if res["status"] != 200:
        return {"ok": False, "status": res["status"], "url": url, "data": data, "raw_text": bytes_to_text_snippet(res["body_bytes"])}
    if not isinstance(data, dict):
        return {"ok": False, "status": res["status"], "url": url, "data": data, "raw_text": bytes_to_text_snippet(res["body_bytes"])}
    token = safe_str(data.get("hashToken"))
    if not token:
        return {"ok": False, "status": res["status"], "url": url, "data": data, "raw_text": bytes_to_text_snippet(res["body_bytes"])}
    return {"ok": True, "status": res["status"], "url": url, "token": token, "data": data}


def ensure_auth(headers: dict, env: dict, mode: str, timeout_s: int, bearer: bool):
    hdrs = dict(headers or {})
    m = safe_str(mode).lower() or "none"
    if m == "none":
        return hdrs, None
    if m == "env":
        token = safe_str(env.get("AUTHORIZATION_TOKEN"))
        if not token:
            raise ValueError("AUTHORIZATION_TOKEN não encontrado no ambiente")
        hdrs["Authorization"] = ("Bearer " + token) if bearer else token
        return hdrs, {"mode": "env"}
    if m == "tokenservice":
        token_res = token_service_get(env, timeout_s)
        if not token_res.get("ok"):
            return hdrs, {"mode": "tokenService", "error": token_res}
        token = token_res["token"]
        hdrs["Authorization"] = ("Bearer " + token) if bearer else token
        return hdrs, {"mode": "tokenService", "token_url": token_res.get("url")}
    raise ValueError(f"auth inválido: {mode}")


def save_run(run_dir: Path, request_snapshot: dict, response_snapshot: dict):
    run_dir.mkdir(parents=True, exist_ok=True)
    (run_dir / "request.json").write_text(json.dumps(request_snapshot, ensure_ascii=False, indent=2) + "\n", "utf-8")
    (run_dir / "response.json").write_text(json.dumps(response_snapshot, ensure_ascii=False, indent=2) + "\n", "utf-8")


def cmd_request(args):
    env = load_env(Path(args.env_file))
    headers = parse_header_list(args.header)
    query = parse_kv_list(args.query)
    url = add_query(args.url, query)
    body_bytes = None
    if args.json is not None:
        body_bytes = args.json.encode("utf-8")
        if "Content-Type" not in headers and "content-type" not in {k.lower() for k in headers.keys()}:
            headers["Content-Type"] = "application/json"
    if args.json_file is not None:
        body_bytes = Path(args.json_file).read_bytes()
        if "Content-Type" not in headers and "content-type" not in {k.lower() for k in headers.keys()}:
            headers["Content-Type"] = "application/json"
    if "Accept" not in headers and "accept" not in {k.lower() for k in headers.keys()}:
        headers["Accept"] = "application/json"
    headers, auth_meta = ensure_auth(headers, env, args.auth, args.timeout, args.bearer)
    res = http_request(args.method, url, headers, body_bytes, args.timeout)
    body_print = format_body_for_print(res.get("content_type", ""), res.get("body_bytes", b""), args.max_body, args.full_body)

    request_snapshot = {
        "at": now_iso_z(),
        "method": args.method.upper(),
        "url": url,
        "headers": redact_headers(headers),
        "auth": auth_meta,
        "query": query,
        "body_json": try_parse_json_bytes(body_bytes or b"") if body_bytes else None,
    }
    response_snapshot = {
        "at": now_iso_z(),
        "status": res.get("status"),
        "ok": bool(res.get("ok")),
        "duration_ms": res.get("duration_ms"),
        "content_type": res.get("content_type"),
        "headers": res.get("headers") if args.print_headers else None,
        "body": body_print,
        "error": res.get("error"),
    }

    sys.stdout.write(json.dumps({"request": request_snapshot, "response": response_snapshot}, ensure_ascii=False, indent=2) + "\n")

    if args.save:
        ts = now_compact_z()
        run_dir = Path(args.runs_dir) / ts
        save_run(run_dir, request_snapshot, response_snapshot)


def load_endpoints(path: Path):
    data = json.loads(path.read_text("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("requests.json deve ser um objeto JSON")
    return data


def substitute_vars(template: str, env: dict):
    def repl(m):
        key = m.group(1)
        return safe_str(env.get(key))

    return re.sub(r"\$\{([A-Z0-9_]+)\}", repl, template)


def cmd_run(args):
    env = load_env(Path(args.env_file))
    endpoints = load_endpoints(Path(args.endpoints_file))
    spec = endpoints.get(args.name)
    if spec is None:
        raise SystemExit(f"endpoint não encontrado: {args.name}")
    if not isinstance(spec, dict):
        raise SystemExit("endpoint inválido (esperado objeto)")

    method = safe_str(spec.get("method") or "GET").upper()
    base_var = safe_str(spec.get("baseVar"))
    path = safe_str(spec.get("path"))
    url = safe_str(spec.get("url"))

    if url:
        final_url = substitute_vars(url, env)
    else:
        if not base_var:
            raise SystemExit("endpoint precisa de url ou baseVar+path")
        base = resolve_base_url(env, base_var)
        final_url = join_url(base, path)

    query = {}
    query.update({k: str(v) for k, v in (spec.get("queryDefaults") or {}).items()})
    query.update(parse_kv_list(args.param))
    query.update(parse_kv_list(args.query))
    final_url = add_query(final_url, query)

    headers = {}
    headers.update({k: safe_str(v) for k, v in (spec.get("headers") or {}).items()})
    headers.update(parse_header_list(args.header))
    if "Accept" not in headers and "accept" not in {k.lower() for k in headers.keys()}:
        headers["Accept"] = "application/json"

    auth = safe_str(args.auth or spec.get("auth") or "none")
    headers, auth_meta = ensure_auth(headers, env, auth, args.timeout, args.bearer)
    if auth_meta and auth_meta.get("mode") == "tokenService" and auth_meta.get("error"):
        sys.stdout.write(json.dumps({"ok": False, "auth": auth_meta}, ensure_ascii=False, indent=2) + "\n")
        return

    body_bytes = None
    if args.json is not None:
        body_bytes = args.json.encode("utf-8")
        if "Content-Type" not in headers and "content-type" not in {k.lower() for k in headers.keys()}:
            headers["Content-Type"] = "application/json"
    if args.json_file is not None:
        body_bytes = Path(args.json_file).read_bytes()
        if "Content-Type" not in headers and "content-type" not in {k.lower() for k in headers.keys()}:
            headers["Content-Type"] = "application/json"

    res = http_request(method, final_url, headers, body_bytes, args.timeout)
    body_print = format_body_for_print(res.get("content_type", ""), res.get("body_bytes", b""), args.max_body, args.full_body)

    request_snapshot = {
        "at": now_iso_z(),
        "name": args.name,
        "method": method,
        "url": final_url,
        "headers": redact_headers(headers),
        "auth": auth_meta,
        "query": query,
        "body_json": try_parse_json_bytes(body_bytes or b"") if body_bytes else None,
    }
    response_snapshot = {
        "at": now_iso_z(),
        "status": res.get("status"),
        "ok": bool(res.get("ok")),
        "duration_ms": res.get("duration_ms"),
        "content_type": res.get("content_type"),
        "headers": res.get("headers") if args.print_headers else None,
        "body": body_print,
        "error": res.get("error"),
    }

    sys.stdout.write(json.dumps({"request": request_snapshot, "response": response_snapshot}, ensure_ascii=False, indent=2) + "\n")

    if args.save:
        ts = now_compact_z()
        run_dir = Path(args.runs_dir) / ts
        save_run(run_dir, request_snapshot, response_snapshot)


def build_parser():
    p = argparse.ArgumentParser(prog="runner.py")
    p.add_argument("--env-file", default=str(DEFAULT_ENV_FILE))
    p.add_argument("--endpoints-file", default=str(DEFAULT_ENDPOINTS_FILE))
    p.add_argument("--runs-dir", default=str(DEFAULT_RUNS_DIR))
    sub = p.add_subparsers(dest="cmd", required=True)

    p_req = sub.add_parser("request")
    p_req.add_argument("--method", required=True)
    p_req.add_argument("--url", required=True)
    p_req.add_argument("--header", action="append", default=[])
    p_req.add_argument("--query", action="append", default=[])
    p_req.add_argument("--json")
    p_req.add_argument("--json-file")
    p_req.add_argument("--auth", default="none", choices=["none", "env", "tokenService"])
    p_req.add_argument("--bearer", action="store_true")
    p_req.add_argument("--timeout", type=int, default=30)
    p_req.add_argument("--max-body", type=int, default=2000)
    p_req.add_argument("--full-body", action="store_true")
    p_req.add_argument("--print-headers", action="store_true")
    p_req.add_argument("--save", action="store_true")
    p_req.set_defaults(func=cmd_request)

    p_run = sub.add_parser("run")
    p_run.add_argument("name")
    p_run.add_argument("--param", action="append", default=[])
    p_run.add_argument("--query", action="append", default=[])
    p_run.add_argument("--header", action="append", default=[])
    p_run.add_argument("--json")
    p_run.add_argument("--json-file")
    p_run.add_argument("--auth", choices=["none", "env", "tokenService"])
    p_run.add_argument("--bearer", action="store_true")
    p_run.add_argument("--timeout", type=int, default=30)
    p_run.add_argument("--max-body", type=int, default=2000)
    p_run.add_argument("--full-body", action="store_true")
    p_run.add_argument("--print-headers", action="store_true")
    p_run.add_argument("--save", action="store_true")
    p_run.set_defaults(func=cmd_run)

    return p


def main():
    parser = build_parser()
    args = parser.parse_args()
    try:
        args.func(args)
    except SystemExit:
        raise
    except Exception as e:
        sys.stderr.write(safe_str(e) + "\n")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
