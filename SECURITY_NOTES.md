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

## Conventions for future entries

- Date each entry (UTC-agnostic, local date is fine).
- State what was found, how it was found, the decision made, and why.
- Mark clearly whether a risk was **fixed**, **accepted**, or **deferred**, and note any follow-up condition that should trigger revisiting it.
