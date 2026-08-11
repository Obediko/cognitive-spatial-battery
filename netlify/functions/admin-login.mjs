import { createHash } from "node:crypto";
import { getStore } from "@netlify/blobs";
import {
  clearAdminCookie,
  createAdminToken,
  json,
  setAdminCookie,
  verifyPassword,
  verifyRequestOrigin
} from "./_security.mjs";

const MAX_FAILURES = 5;
const BLOCK_MS = 15 * 60 * 1000;

function clientKey(req, context) {
  const raw = context.ip || req.headers.get("x-nf-client-connection-ip") || "unknown";
  return createHash("sha256").update(raw).digest("hex");
}

export default async function handler(req, context) {
  if (!verifyRequestOrigin(req)) return json({ error: "Invalid request origin" }, 403);
  if (req.method === "DELETE") {
    clearAdminCookie(context);
    return json({ ok: true });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const attempts = getStore("csb-auth-attempts");
  const key = clientKey(req, context);
  const record = await attempts.get(key, { type: "json", consistency: "strong" }) || { failures: 0, blockedUntil: 0 };
  if (Number(record.blockedUntil) > Date.now()) {
    return json({ error: "Too many failed attempts. Try again later." }, 429);
  }

  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  let valid = false;
  try { valid = verifyPassword(body.password); }
  catch (error) { return json({ error: error.message }, 503); }

  if (!valid) {
    const failures = Number(record.failures || 0) + 1;
    await attempts.setJSON(key, {
      failures,
      blockedUntil: failures >= MAX_FAILURES ? Date.now() + BLOCK_MS : 0,
      updatedAt: new Date().toISOString()
    });
    return json({ error: "Invalid password" }, 401);
  }

  await attempts.delete(key);
  setAdminCookie(context, createAdminToken());
  return json({ ok: true, expiresInSeconds: 8 * 60 * 60 });
}
