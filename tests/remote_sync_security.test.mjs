import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const security = readFileSync("netlify/functions/_security.mjs", "utf8");
const login = readFileSync("netlify/functions/admin-login.mjs", "utf8");
const sessions = readFileSync("netlify/functions/admin-sessions.mjs", "utf8");
const sync = readFileSync("netlify/functions/session-sync.mjs", "utf8");
const client = readFileSync("js/remote_sync.js", "utf8");

assert.match(security, /httpOnly:\s*true/);
assert.match(security, /secure:\s*true/);
assert.match(security, /sameSite:\s*"Strict"/);
assert.match(login, /MAX_FAILURES\s*=\s*5/);
assert.match(sessions, /verifyAdminRequest/);
assert.match(sessions, /verifyPassword\(body\.password\)/);
assert.match(sessions, /Only actively ongoing sessions can be deleted here/);
assert.doesNotMatch(sessions.match(/const DELETABLE[^;]+;/s)[0], /participant_complete|examiner_review_complete/);
assert.match(sync, /participantTokenHash/);
assert.match(sync, /MAX_ARTIFACT_BYTES/);
assert.doesNotMatch(client, /ADMIN_PASSWORD_HASH|ADMIN_SESSION_SECRET|SYNC_TOKEN_PEPPER/);
assert.doesNotMatch([security, login, sessions, sync, client].join("\n"), /Obed!Cognitive/);
console.log("remote sync security invariants passed");
