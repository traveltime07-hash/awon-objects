import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "dev-secret-change-me";

function b64url(input: Buffer | string) {
  const b = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return b
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
function b64urlDecode(str: string) {
  const pad = str.length % 4 ? 4 - (str.length % 4) : 0;
  const s = (str + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(s, "base64").toString("utf8");
}

export type SessionPayload = {
  email: string;
  role: "admin" | "user";
  exp: number; // unix seconds
};

export function signSession(payload: SessionPayload) {
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac("sha256", SECRET).update(body).digest());
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined): SessionPayload | null {
  try {
    if (!token) return null;
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const check = b64url(crypto.createHmac("sha256", SECRET).update(body).digest());
    if (check !== sig) return null;
    const json = JSON.parse(b64urlDecode(body));
    if (!json || typeof json !== "object") return null;
    if (typeof json.exp !== "number" || json.exp < Math.floor(Date.now() / 1000)) return null;
    return json as SessionPayload;
  } catch {
    return null;
  }
}

export function parseCookies(req: any): Record<string, string> {
  const out: Record<string, string> = {};
  const raw = (req.headers?.cookie as string) || "";
  raw.split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > -1) {
      const k = p.slice(0, i).trim();
      const v = decodeURIComponent(p.slice(i + 1).trim());
      out[k] = v;
    }
  });
  return out;
}

export function serializeCookie(
  name: string,
  value: string,
  opts: { httpOnly?: boolean; maxAge?: number; path?: string; sameSite?: "Lax" | "Strict" | "None"; secure?: boolean } = {}
) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge !== undefined) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push(`Path=${opts.path || "/"}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

export function setSessionCookie(res: any, payload: SessionPayload) {
  const token = signSession(payload);
  const cookie = serializeCookie("session", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "Lax",
    secure: true,
  });
  res.setHeader("Set-Cookie", cookie);
}

export function clearSessionCookie(res: any) {
  const cookie = serializeCookie("session", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "Lax",
    secure: true,
  });
  res.setHeader("Set-Cookie", cookie);
}
