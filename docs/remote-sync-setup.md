# Secure cross-device synchronization setup

The repository contains the synchronization code, but it remains unavailable until the server secrets below are configured in Netlify. Never place a plaintext password, password hash, sync token, or session secret in GitHub or browser JavaScript.

## 1. Choose a new admin password

A password previously posted in chat must be treated as exposed and must not be reused. Choose a new, unique password with at least 12 characters and store it in a password manager.

Generate its server-side scrypt hash locally without putting the password in shell history:

```bash
read -s CSB_ADMIN_PASSWORD
export ADMIN_PASSWORD="$CSB_ADMIN_PASSWORD"
node scripts/hash_admin_password.mjs
unset ADMIN_PASSWORD CSB_ADMIN_PASSWORD
```

Copy only the generated `saltHex:hashHex` result into Netlify.

## 2. Configure Netlify secrets

In the Netlify site dashboard, open **Site configuration → Environment variables**. Create these variables, scope them to Functions, mark them as secret, and apply them to Production:

- `ADMIN_PASSWORD_HASH`: the generated scrypt value
- `ADMIN_SESSION_SECRET`: a cryptographically random value of at least 32 bytes
- `SYNC_TOKEN_PEPPER`: a separate cryptographically random value of at least 32 bytes

Generate each random secret locally with:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Use a different output for each variable, then trigger a fresh deploy.

## 3. Validate before collecting research data

1. Open the participant battery on the deployed HTTPS site and enter a pseudonymous ID.
2. Complete a short pilot task with microphone capture.
3. Keep the completion screen open until it reports that synchronization finished.
4. On another device, open `/admin.html`, sign in, and confirm the checkpoint and audio load.
5. Create a disposable **in-progress** session and verify deletion requires both confirmation and password re-entry.
6. Confirm completed or examiner-verified sessions do not show the ongoing-session delete action.
7. Confirm the consent/ethics documentation explicitly covers remote storage of pseudonymous responses, drawings, and voice recordings, access control, retention, and deletion.

## Data protection notes

- The browser keeps a local recovery copy while uploads run in the background.
- Participant upload credentials are random per session and are not examiner passwords.
- Examiner login uses a secure, HTTP-only, same-site cookie.
- Failed login attempts are rate-limited.
- Deletion is limited to actively ongoing sessions and creates a non-identifying audit event.
- Netlify Blobs encrypts data in transit and at rest, but Netlify does not present Blobs as a HIPAA-compliant offering. Use only under the approved research governance and retention plan.
