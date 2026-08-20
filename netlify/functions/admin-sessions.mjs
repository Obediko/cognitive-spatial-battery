import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";
import {
  json, opaqueAuditId, validRemoteId, verifyAdminRequest, verifyPassword, verifyRequestOrigin
} from "./_security.mjs";

const sessions = () => getStore("csb-sessions");
const artifacts = () => getStore("csb-artifacts");
const audit = () => getStore("csb-audit");
function publicMetadata(id, record) {
  return {
    remoteId: id,
    participantId: record.participantId,
    sessionStatus: record.sessionStatus || "in_progress",
    batteryChoice: record.batteryChoice || null,
    savedAt: record.savedAt || null,
    trialCount: Number(record.trialCount || 0)
  };
}

function authorize(req) {
  if (!verifyRequestOrigin(req)) return json({ error: "Invalid request origin" }, 403);
  if (!verifyAdminRequest(req)) return json({ error: "Authentication required" }, 401);
  return null;
}

export default async function handler(req) {
  const denied = authorize(req);
  if (denied) return denied;

  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id");
    if (id) {
      if (!validRemoteId(id)) return json({ error: "Invalid session ID" }, 400);
      const record = await sessions().get(id, { type: "json", consistency: "strong" });
      if (!record) return json({ error: "Session not found" }, 404);
      const listed = await artifacts().list({ prefix: id + "/" });
      return json({
        session: publicMetadata(id, record),
        checkpoint: record.checkpoint,
        artifactKeys: listed.blobs.map(item => item.key.slice(id.length + 1))
      });
    }
    const listed = await sessions().list();
    const rows = [];
    for (const item of listed.blobs) {
      const record = await sessions().get(item.key, { type: "json", consistency: "strong" });
      if (record) rows.push(publicMetadata(item.key, record));
    }
    rows.sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")));
    return json({ sessions: rows });
  }

  if (req.method === "PUT") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    if (!validRemoteId(body.id) || !body.checkpoint || !Array.isArray(body.checkpoint.trials)) {
      return json({ error: "Invalid checkpoint" }, 400);
    }
    const record = await sessions().get(body.id, { type: "json", consistency: "strong" });
    if (!record) return json({ error: "Session not found" }, 404);
    const savedAt = new Date().toISOString();
    await sessions().setJSON(body.id, {
      ...record,
      participantId: body.checkpoint.participantId || record.participantId,
      sessionStatus: body.checkpoint.sessionStatus || record.sessionStatus,
      batteryChoice: body.checkpoint.batteryChoice || record.batteryChoice,
      savedAt,
      trialCount: body.checkpoint.trials.length,
      checkpoint: { ...body.checkpoint, remoteId: body.id, remoteSavedAt: savedAt }
    });
    return json({ ok: true, savedAt });
  }

  if (req.method === "DELETE") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    if (!validRemoteId(body.id)) return json({ error: "Invalid session ID" }, 400);
    let passwordOk = false;
    try { passwordOk = verifyPassword(body.password); }
    catch (error) { return json({ error: error.message }, 503); }
    if (!passwordOk) return json({ error: "Password confirmation failed" }, 401);
    const record = await sessions().get(body.id, { type: "json", consistency: "strong" });
    if (!record) return json({ error: "Session not found" }, 404);
    const listed = await artifacts().list({ prefix: body.id + "/" });
    for (const item of listed.blobs) await artifacts().delete(item.key);
    await sessions().delete(body.id);
    await audit().setJSON(randomUUID(), {
      action: "delete_session",
      remoteIdHash: opaqueAuditId(body.id),
      previousStatus: record.sessionStatus || "in_progress",
      deletedAt: new Date().toISOString()
    });
    return json({ ok: true, deletedArtifacts: listed.blobs.length });
  }

  return json({ error: "Method not allowed" }, 405);
}
