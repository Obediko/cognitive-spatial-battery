import {
  createHmac,
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";

const COOKIE_NAME = "csb_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function secret(name) {
  const value = process.env[name];
  if (!value) throw new Error("Missing required server secret: " + name);
  return value;
}

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function sign(value) {
  return createHmac("sha256", secret("ADMIN_SESSION_SECRET")).update(value).digest("base64url");
}

export function verifyRequestOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(req.url).origin;
}

export function verifyPassword(password) {
  const configured = secret("ADMIN_PASSWORD_HASH");
  const parts = configured.split(":");
  if (parts.length !== 2 || !/^[a-f0-9]+$/i.test(parts[0]) || !/^[a-f0-9]+$/i.test(parts[1])) {
    throw new Error("ADMIN_PASSWORD_HASH must use saltHex:hashHex format");
  }
  const salt = Buffer.from(parts[0], "hex");
  const expected = Buffer.from(parts[1], "hex");
  const actual = scryptSync(String(password || ""), salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createAdminToken() {
  const payload = base64url(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: randomBytes(12).toString("hex")
  }));
  return payload + "." + sign(payload);
}

export function verifyAdminRequest(req) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(new RegExp("(?:^|;\\s*)" + COOKIE_NAME + "=([^;]+)"));
  if (!match) return false;
  const token = decodeURIComponent(match[1]);
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const expected = sign(parts[0]);
  const supplied = Buffer.from(parts[1]);
  const calculated = Buffer.from(expected);
  if (supplied.length !== calculated.length || !timingSafeEqual(supplied, calculated)) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    return Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function setAdminCookie(context, token) {
  context.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export function clearAdminCookie(context) {
  context.cookies.delete({ name: COOKIE_NAME, path: "/" });
}

export function participantTokenHash(token) {
  return createHmac("sha256", secret("SYNC_TOKEN_PEPPER")).update(String(token || "")).digest("hex");
}

export function opaqueAuditId(remoteId) {
  return createHash("sha256").update(String(remoteId || "")).digest("hex");
}

export function validRemoteId(value) {
  return /^[a-f0-9-]{20,64}$/i.test(String(value || ""));
}

export function validArtifactKey(value) {
  return /^(?:osr\/(?:immediate|delayed)|asf\/main|ovn\/(?:[0-9]|[12][0-9]|3[01]))$/.test(String(value || ""));
}

export function json(data, status = 200, headers = {}) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...headers }
  });
}
