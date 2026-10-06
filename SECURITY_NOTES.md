# Security Notes — DrukJourneys

A running log of security-relevant decisions made during implementation: accepted risks, dependency issues, and the reasoning behind them. This supplements the risk register in `STLC_DrukJourneys.md` with implementation-level detail.

---

## 2026-09-29 — `npm audit` findings in `server/` (accepted, no action)

**Found via:** `npm audit` after installing `prisma@7.10.0` and `@prisma/client@7.10.0`.

| Package | Severity | Issue | Assessment |
|---|---|---|---|
| `deepmerge-ts` (via `@prisma/config`) | High | Stack exhaustion when merging deeply recursive object graphs | **Accepted.** Only runs against our own local Prisma config files at CLI time (`prisma generate`, `prisma migrate`). No attacker-controlled input reaches this code path. |
| `mysql2` (via `prisma`) | High | Auth plugin downgrade leaking plaintext credentials; decompression-bomb DoS | **Accepted — not applicable.** This is a MySQL driver bundled by the Prisma CLI to support multiple database backends. We use PostgreSQL exclusively; no MySQL connection is ever opened, so this code path is unreachable in our application. |

**Decision:** Do not run `npm audit fix --force`. That flag can force-downgrade `prisma`/`@prisma/client` below the exact version we pinned (`7.10.0`), risking a CLI/client version mismatch (see the version-pinning note below) in exchange for patching two issues that carry no real exposure in this project.

**Follow-up:** Re-run `npm audit` periodically, especially after upgrading Prisma versions. Revisit if either package ever becomes reachable from user input (it shouldn't, by design).

---

## 2026-09-29 — Pinned `prisma` and `@prisma/client` to exact matching versions

**Issue found:** Installing both packages via `npm install <pkg> --save-dev` (no version specified) resolved to mismatched majors — `prisma@^8.0.0-rc.19` (an unreleased release candidate) against `@prisma/client@^7.10.0` (stable). The npm registry's `latest` dist-tag for the two packages was pointing at different major versions at the time.

**Fix:** Reinstalled both pinned to the exact same stable version, `7.10.0`, using `--save-exact` (no `^` range) so a future `npm install` can't silently drift them apart again.

**Why this matters:** Prisma requires the CLI and client library to match exactly — a version skew between them causes confusing runtime errors that are hard to diagnose after the fact. Always verify version alignment for tightly-coupled tool/library pairs rather than trusting default `latest` resolution.

---

## 2026-10-01 — Document upload: local-disk storage, deferred risk on encryption-at-rest

**Context:** Built passport/ID document upload (FR-11) for Sprint 3. Decisions made:

- **Server-side file type validation** — only PDF/JPG/PNG accepted (checked via the browser-reported MIME type), and file size capped at 10 MB, both enforced before any disk write.
- **Random storage keys** — uploaded files are saved under a UUID-based filename, never the client-supplied original filename, to prevent path traversal and avoid leaking filesystem structure. The original filename is kept only as metadata in the database, and is sanitized (CR/LF and quotes stripped) before being placed in the `Content-Disposition` header on download, to prevent HTTP header injection.
- **Ownership-checked downloads** — documents are served through an authenticated `GET /documents/:id/download` route that verifies the requesting user owns the document, rather than a public static file directory. No document is ever reachable by URL alone.
- **Storage is local disk for now (DEFERRED RISK)** — the SDD specifies encrypted S3-compatible object storage for documents (NFR-6: passport data encrypted at rest). Local disk storage during development does **not** provide encryption at rest. This is an accepted/deferred risk for local development only; the storage layer (`src/lib/storage.ts`) is isolated behind a small function interface specifically so swapping in real encrypted object storage later does not require touching the document service or routes. **Must be resolved before any real user data (even test passport scans) is stored in anything other than a local dev environment.**

**Follow-up:** Before deploying anywhere beyond local development, replace `src/lib/storage.ts` with an S3-compatible implementation using server-side encryption, and confirm `uploads/` is never included in any deployment artifact or backup taken off the dev machine.

**Update (2026-10-05):** Encryption at rest, magic-byte validation and staff access were implemented; see the 2026-10-05 entry below. Swapping to real object storage is still open.

---

## 2026-10-04 — Payment integration (Stripe): PCI scope, webhook verification, secret handling

**Context:** Built Stripe payment processing for Sprint 5 (FR-18/19 — USD payments for international bookings, invoiced separately as package cost + SDF). Decisions made:

- **Card data never touches our server** — we use Stripe's Payment Intents model: the server only creates a `PaymentIntent` and returns its `client_secret`; actual card entry and submission happens directly between the traveler's browser and Stripe (via Stripe Elements on the eventual frontend). This keeps the application out of PCI-DSS scope — no card number, CVV, or expiry ever passes through or is stored by our backend.
- **Webhook signature verification is mandatory, not best-effort** — `POST /payments/webhook` reads the raw, unparsed request body (never `c.req.json()` first) and verifies it against `STRIPE_WEBHOOK_SECRET` via `stripe.webhooks.constructEvent()` before trusting any event. If the webhook secret isn't configured (e.g. local dev without the Stripe CLI), the route returns `501` rather than silently accepting unverified events — we deliberately do not fall back to trusting an unsigned payload.
- **`STRIPE_SECRET_KEY` handling** — like `JWT_SECRET` and `DATABASE_URL`, written directly into `.env` without ever being echoed back in chat/logs; verified only by checking that the variable *name* is present, never its value.
- **Dev-only sync endpoint (`POST /bookings/:id/payments/sync`)** — added because a webhook can't reach a developer's machine without a public URL. This is a deliberate, narrower-trust alternative to the webhook, not a replacement for it: it requires a logged-in user, enforces the same booking-ownership check as every other booking route, and actively calls Stripe's API to fetch the PaymentIntent's real status rather than trusting any client-supplied status value. **Must not ship to production** — the signed webhook is the only trusted status-update path once deployed; this is called out again as a TODO once a staging/production environment exists.

**Follow-up:** Before any real deployment: (1) set up `STRIPE_WEBHOOK_SECRET` via the Stripe CLI or Stripe Dashboard and confirm the real webhook path end-to-end; (2) remove or gate off the dev-only `/payments/sync` endpoint behind a non-production environment check; (3) switch `sk_test_...`/webhook secret to live-mode keys only once the operator's real Stripe account is verified for live payments.

---

## 2026-10-04 — Fixed: auth middleware accidentally blocking the Stripe webhook

**Found via:** Live end-to-end testing with the Stripe CLI (`stripe listen --forward-to localhost:3000/payments/webhook`). The webhook kept returning `401 Missing or malformed Authorization header` even though the webhook route itself has no `requireAuth` call and is not supposed to require a logged-in user at all.

**Root cause:** `authedPaymentRoutes` (which legitimately requires a logged-in user for `/bookings/:id/payments/intent` and `/sync`) was mounted in `index.ts` at the root path (`app.route('/', authedPaymentRoutes)`). Because its `requireAuth` middleware was registered with a wildcard (`authedPaymentRoutes.use('*', requireAuth)`), and Hono composes matching middleware across the whole merged route tree rather than only within an isolated sub-path, mounting it at `/` caused that `requireAuth` check to run against **every** request handled by the app — including `POST /payments/webhook`, a route on a completely separate, intentionally unauthenticated sub-router. Stripe never sends an `Authorization` header (it authenticates via the `stripe-signature` header instead), so every webhook call was rejected before it ever reached the signature-verification code.

**Why this matters beyond this one bug:** This is a routing/mounting mistake, not a logic mistake — the webhook's own signature-verification code was correct the entire time and was never actually exercised until this test. A route or middleware intended to be scoped can silently become global if it's mounted at `/` (or any prefix that's a parent of a route meant to stay public). This is exactly the kind of bug that passes a casual code review (the webhook handler itself looks correct in isolation) but fails in integration — which is why this was only caught by actually running `stripe listen` end-to-end, not by reading the code.

**Fix:** Changed `authedPaymentRoutes`'s internal route paths from `/bookings/:id/payments/...` to `/:id/payments/...`, and mounted it at `app.route('/bookings', authedPaymentRoutes)` instead of `/`. Its `requireAuth` middleware is now scoped only to paths actually under `/bookings`, and no longer intercepts `/payments/webhook`.

**Verified:** Full round trip tested with the Stripe CLI — `stripe listen` forwarded a real `payment_intent.succeeded` event, the webhook responded `200` (previously `401`), and the booking's status flipped to `CONFIRMED` in the database without calling the dev-only `/sync` endpoint at all.

**Follow-up:** When adding any new authenticated sub-router in the future, mount it at the narrowest path prefix that's actually correct for it, never at `/`, and specifically double-check that doing so doesn't shadow any route meant to be public (webhooks, health checks, etc.). Worth a quick audit of `index.ts`'s other `app.route()` calls to confirm none of them have the same issue — they don't appear to (none of the others are mounted at `/`), but this is the kind of bug worth re-checking after any future route restructuring.

---

## 2026-10-05: Document hardening for NFR-6 (encryption at rest, content validation, staff access)

**Context:** Sprint 8 review of NFR-6 (passport and ID data encrypted at rest and restricted to authorized staff) found two gaps in the Sprint 3 document module: files were stored as plaintext on disk, and no staff path existed at all (only the owner could read a document, so nobody could verify one). Upload validation also trusted the client-declared MIME type: a PNG labeled `application/pdf` was accepted.

**Decisions:**

- **Application-level AES-256-GCM in the storage layer.** `src/lib/crypto.ts` encrypts every file inside `saveFile` and decrypts it inside `readStoredFile`, so `document/service.ts` and the routes are unaware of it. Stored layout is IV (12 bytes) | auth tag (16 bytes) | ciphertext, with a fresh random IV per file. GCM also authenticates, so a modified file fails to decrypt rather than being served. Chosen over relying on disk or database encryption because it works on local disk today and carries over unchanged to object storage later.
- **Key handling.** `DOCUMENT_ENCRYPTION_KEY` (32 random bytes, base64) lives in `.env`, which is gitignored. The server refuses to start if it is missing or the wrong length, matching the JWT and Gmail secrets. The dev key must never be reused in production.
- **Magic-byte validation.** Uploads are now checked against the file's real leading bytes (PDF, PNG, JPEG signatures). A declared type that disagrees with the contents is rejected with `400`. The stored `mimeType` is the detected type, not the claimed one.
- **Owner-or-staff access.** Documents are readable by their owner or by an Agent/Admin (same pattern as invoices). Staff also get `GET /documents/all` (optional `?status=`) and `PATCH /documents/:id/status`, which can set `APPROVED` or `REJECTED` only. Travelers cannot change a document's status.

**Also fixed in passing:** `requireRole` is now built with Hono's `createMiddleware`, which restores route path-param types after it (this cleared the long-standing `string | undefined` error in `booking/routes.ts`). `jwt.ts` now binds the checked secret to an explicit `string`. `npx tsc --noEmit` reports zero errors.

**Verified (live):** the stored file is exactly original size + 28 bytes, does not begin with the PNG signature, and contains no PNG markers; a download returned a byte-identical file (matching SHA-256); a PNG labeled as PDF returned `400`; another tourist got `403` on download; a tourist got `403` trying to approve their own document; an agent could list, download and approve (`200`); `requireRole` still returns `200` for staff and `403` for tourists on `/support-inquiries`.

**Known gaps and follow-up (deferred):**

- Staff views and approvals are not audit-logged (who opened which passport, and when). Worth adding before real use.
- No key rotation. The stored format carries no key id, so rotating means re-encrypting every file. Losing the key makes all stored documents unrecoverable, so it must be backed up separately from the data. In production it belongs in a secrets manager or KMS.
- Only file contents are encrypted. Filenames and document metadata are plaintext in the database, and other personal fields on `User` are not field-encrypted; database encryption at rest is a deployment concern.
- Files uploaded before today (for example `uploads/a64decf2...pdf`) are plaintext and will fail to download. They are test data and should be deleted.
- Storage is still local disk. When swapping to object storage, keep the encrypt and decrypt calls (or use server-side encryption).
- There is no document delete endpoint or retention policy.

---

## 2026-10-05: Rate limiting on auth endpoints and security response headers

**Context:** Sprint 8 hardening. Login had no protection against password guessing, and responses carried no security headers.

**Decisions:**

- **Per-IP rate limits on auth endpoints** (`src/lib/rate-limit.ts`): `/auth/login` 10 per 15 minutes, `/auth/register` 10 per hour, `/auth/refresh` 30 per 15 minutes. Over the limit returns `429` with a `Retry-After` header. `/auth/logout` and `/auth/me` are not limited.
- **Client key is the socket's remote address, not `X-Forwarded-For`.** A client can set that header to any value, which would let an attacker dodge the limit by rotating fake IPs.
- **No new dependency.** The limiter is a small in-memory fixed-window counter with a periodic sweep of expired entries, so memory cannot grow without bound.
- **`secureHeaders()` (Hono built-in) on every response:** `X-Content-Type-Options: nosniff` (also relevant to document downloads), `X-Frame-Options`, `Strict-Transport-Security`, `Referrer-Policy`, and related headers.

**Verified (live):** 12 wrong-password logins in a row returned ten `401`s and then `429` with `Retry-After: 895`; the response headers included `x-content-type-options: nosniff`, `x-frame-options: SAMEORIGIN` and `strict-transport-security`.

**Known limits and follow-up (deferred):**

- Counters live in process memory: they reset on restart and are not shared across multiple server instances. A multi-instance deployment needs a shared store such as Redis.
- Behind a reverse proxy, every request would appear to come from the proxy's IP, so a trusted-proxy setting is needed at deployment time or all users would share one budget.
- The limit is per IP only. Many users behind one shared IP share a budget, and an attacker with many IPs is not slowed. A per-account failed-login lockout would be a stronger addition.
- A fixed window allows a short burst of up to double the limit across a window boundary. Acceptable for now.
- No global limit on the rest of the API yet; this should be weighed against the NFR-2 load test.
- `secureHeaders()` defaults include `Cross-Origin-Resource-Policy: same-origin`. When the frontend runs on a different origin, CORS and possibly this header will need explicit configuration.

---

## 2026-10-06: Dependency audit, nodemailer upgrade

**Found:** `npm audit` reported several advisories against `nodemailer` 7.0.9, a production dependency (the worst was a high-severity denial of service in its address parser, affecting versions up to 7.0.10; others were SMTP/header injection and file-access bypass issues in features this project does not use).

**Fixed:** upgraded `nodemailer` to 10.0.15 and `@types/nodemailer` to 8.0.2 (both pinned exactly). Type check clean. Verified live afterwards with real emails sent through Gmail SMTP for SDF_CALCULATED, GUIDE_ASSIGNED and BOOKING_CONFIRMED, each recorded as SENT and received in a real inbox.

**Accepted (dev-only):** the 7 remaining findings sit in the Prisma CLI chain (`prisma`, `@prisma/config`, `deepmerge-ts`, `mysql2`) and in `autocannon` (`hyperid`, `uuid`). None of these packages run in the deployed server; they are command-line and test tooling. The suggested `npm audit fix --force` would downgrade Prisma to 6.x, which is a breaking change for this Prisma 7 project, so it is deliberately not run. Revisit when Prisma publishes a release that bumps `deepmerge-ts`, or if the build ever runs these tools in a production image.

**Not yet tested live:** BOOKING_CANCELLED after the upgrade (same code path as the others).

## Conventions for future entries

- Date each entry (UTC-agnostic, local date is fine).
- State what was found, how it was found, the decision made, and why.
- Mark clearly whether a risk was **fixed**, **accepted**, or **deferred**, and note any follow-up condition that should trigger revisiting it.
