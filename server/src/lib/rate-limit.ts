import { createMiddleware } from 'hono/factory'
import { timingSafeEqual } from 'node:crypto'
import { isIP } from 'node:net'
import { getConnInfo } from '@hono/node-server/conninfo'
import type { Context } from 'hono'

type RateLimitOptions = {
  windowMs: number // length of each counting window
  max: number // requests allowed per client per window
}

type Entry = { count: number; resetAt: number }

const proxySecret = process.env.TRUSTED_PROXY_SECRET

function secretMatches(provided: string | undefined): boolean {
  if (!proxySecret || !provided) {
    return false
  }
  const a = Buffer.from(provided)
  const b = Buffer.from(proxySecret)
  return a.length === b.length && timingSafeEqual(a, b)
}

// The web server sits in front of this API, so every visitor's request
// arrives from the web server's own address. The web server therefore
// forwards the visitor's address in X-Client-IP together with a shared
// secret. The header is trusted ONLY when the secret matches, so nobody
// else can pick their own rate-limit bucket by sending it.
function clientKey(c: Context): string {
  const forwarded = c.req.header('x-client-ip')
  if (secretMatches(c.req.header('x-proxy-secret')) && forwarded && isIP(forwarded) !== 0) {
    return forwarded
  }
  return getConnInfo(c).remote.address ?? 'unknown'
}

// A simple fixed-window limiter, keyed by the client's connection IP.
// Each call to rateLimit() gets its own counters, so login and register
// are limited independently.
//
// Limits of this design (documented in SECURITY_NOTES.md):
// - Counters live in this process's memory: they reset on restart and are
//   not shared between multiple server instances (use Redis for that).
// - The key is the socket's remote address, unless the request carries the
//   shared proxy secret (see clientKey), in which case it is the visitor
//   address the web server forwarded. X-Forwarded-For is never trusted.
export function rateLimit(options: RateLimitOptions) {
  const hits = new Map<string, Entry>()

  // Drop expired entries periodically so the map cannot grow forever.
  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key)
    }
  }, options.windowMs)
  sweep.unref() // never keep the process alive just for this timer

  return createMiddleware(async (c, next) => {
    const ip = clientKey(c)
    const now = Date.now()
    const entry = hits.get(ip)

    if (!entry || entry.resetAt <= now) {
      hits.set(ip, { count: 1, resetAt: now + options.windowMs })
      await next()
      return
    }

    if (entry.count >= options.max) {
      c.header('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
      return c.json({ error: 'Too many requests, please try again later' }, 429)
    }

    entry.count++
    await next()
  })
}
