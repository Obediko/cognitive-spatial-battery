import { getStore } from "@netlify/blobs";
import { json, validArtifactKey, validRemoteId, verifyAdminRequest } from "./_security.mjs";

export default async function handler(req) {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
  if (!verifyAdminRequest(req)) return json({ error: "Authentication required" }, 401);
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const key = url.searchParams.get("key") || "";
  if (!validRemoteId(id) || !validArtifactKey(key)) return json({ error: "Invalid artifact request" }, 400);
  const result = await getStore("csb-artifacts").getWithMetadata(id + "/" + key, {
    type: "blob", consistency: "strong"
  });
  if (!result) return json({ error: "Artifact not found" }, 404);
  return new Response(result.data, {
    headers: {
      "Content-Type": result.metadata?.contentType || result.data.type || "application/octet-stream",
      "Cache-Control": "private, no-store"
    }
  });
}
