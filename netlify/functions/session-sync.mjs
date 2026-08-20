import { getStore } from "@netlify/blobs";
import {
  json, participantTokenHash, validArtifactKey, validRemoteId, verifyRequestOrigin
} from "./_security.mjs";

const MAX_JSON_BYTES = 3 * 1024 * 1024;
const MAX_ARTIFACT_BYTES = 30 * 1024 * 1024;
const sessions = () => getStore("csb-sessions");
const artifacts = () => getStore("csb-artifacts");

function validCheckpoint(value) {
  return value && typeof value === "object"
    && typeof value.participantId === "string"
    && /^[A-Za-z0-9_-]{1,64}$/.test(value.participantId)
    && Array.isArray(value.trials);
}

async function readSession(remoteId) {
  return sessions().get(remoteId, { type: "json", consistency: "strong" });
}

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!verifyRequestOrigin(req)) return json({ error: "Invalid request origin" }, 403);

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const declared = Number(req.headers.get("content-length") || 0);
    if (declared > MAX_JSON_BYTES) return json({ error: "Checkpoint too large" }, 413);
    let body;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    if (!validRemoteId(body.remoteId) || String(body.token || "").length < 32 || !validCheckpoint(body.checkpoint)) {
      return json({ error: "Invalid checkpoint" }, 400);
    }
    const existing = await readSession(body.remoteId);
    const tokenHash = participantTokenHash(body.token);
    if (existing && existing.tokenHash !== tokenHash) return json({ error: "Forbidden" }, 403);
    const savedAt = new Date().toISOString();
    const record = {
      tokenHash,
      participantId: body.checkpoint.participantId,
      sessionStatus: body.checkpoint.sessionStatus || "in_progress",
      batteryChoice: body.checkpoint.batteryChoice || null,
      savedAt,
      trialCount: body.checkpoint.trials.length,
      checkpoint: { ...body.checkpoint, remoteId: body.remoteId, remoteSavedAt: savedAt }
    };
    await sessions().setJSON(body.remoteId, record);
    return json({ ok: true, remoteId: body.remoteId, savedAt });
  }

  if (contentType.includes("multipart/form-data")) {
    const declared = Number(req.headers.get("content-length") || 0);
    if (declared > MAX_ARTIFACT_BYTES) return json({ error: "Artifact too large" }, 413);
    let form;
    try { form = await req.formData(); } catch { return json({ error: "Invalid form data" }, 400); }
    const remoteId = String(form.get("remoteId") || "");
    const token = String(form.get("token") || "");
    const artifactKey = String(form.get("artifactKey") || "");
    const file = form.get("file");
    if (!validRemoteId(remoteId) || token.length < 32 || !validArtifactKey(artifactKey)
        || !(file instanceof Blob) || file.size > MAX_ARTIFACT_BYTES
        || !String(file.type || "").startsWith("audio/")) {
      return json({ error: "Invalid artifact" }, 400);
    }
    const existing = await readSession(remoteId);
    if (!existing || existing.tokenHash !== participantTokenHash(token)) return json({ error: "Forbidden" }, 403);
    await artifacts().set(remoteId + "/" + artifactKey, file, {
      metadata: { contentType: file.type || "application/octet-stream", savedAt: new Date().toISOString() }
    });
    return json({ ok: true, artifactKey });
  }

  return json({ error: "Unsupported content type" }, 415);
}
