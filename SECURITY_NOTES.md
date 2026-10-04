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

## Conventions for future entries

- Date each entry (UTC-agnostic, local date is fine).
- State what was found, how it was found, the decision made, and why.
- Mark clearly whether a risk was **fixed**, **accepted**, or **deferred**, and note any follow-up condition that should trigger revisiting it.
