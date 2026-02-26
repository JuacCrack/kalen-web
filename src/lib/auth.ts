import crypto from "crypto";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "admin";
};

type Payload = {
  user: AuthUser;
  exp: number;
};

const b64uFromBuf = (buf: Buffer) =>
  buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const b64uFromStr = (s: string) =>
  Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const b64uJson = (obj: unknown) => b64uFromStr(JSON.stringify(obj));

const fromB64u = (s: string) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  return Buffer.from(s + pad, "base64").toString("utf8");
};

const hmac = (data: string, secret: string) =>
  b64uFromBuf(crypto.createHmac("sha256", secret).update(data, "utf8").digest());

export const getAuthSecret = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing AUTH_SECRET");
  return secret;
};

export const signSession = (user: AuthUser, ttlSeconds = 60 * 60 * 24 * 14) => {
  const payload: Payload = { user, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const header = b64uJson({ alg: "HS256", typ: "JWT" });
  const body = b64uJson(payload);
  const data = `${header}.${body}`;
  const sig = hmac(data, getAuthSecret());
  return `${data}.${sig}`;
};

export const verifySession = (token: string): AuthUser | null => {
  try {
    const [h, b, s] = token.split(".");
    if (!h || !b || !s) return null;

    const data = `${h}.${b}`;
    const expected = hmac(data, getAuthSecret());

    const a = Buffer.from(expected, "utf8");
    const c = Buffer.from(s, "utf8");
    if (a.length !== c.length) return null;
    if (!crypto.timingSafeEqual(new Uint8Array(a), new Uint8Array(c))) return null;

    const payload = JSON.parse(fromB64u(b)) as Payload;
    if (!payload?.user || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.user;
  } catch {
    return null;
  }
};