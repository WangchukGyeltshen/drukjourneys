import { createMiddleware } from 'hono/factory'
import { getConnInfo } from '@hono/node-server/conninfo'

type RateLimitOptions = {
  windowMs: number // length of each counting window
  max: number // requests allowed per client per window
}

type Entry = { count: number; resetAt: number }

// A simple fixed-window limiter, keyed by the client's connection IP.
// Each call to rateLimit() gets its own counters, so login and register
// are limited independently.
//
// Limits of this design (documented in SECURITY_NOTES.md):
// - Counters live in this process's memory: they reset on restart and are
//   not shared between multiple server instances (use Redis for that).
// - The key is the socket's remote address, not X-Forwarded-For, because a
//   client can set that header to anything. Behind a reverse proxy every
//   request would share the proxy's IP, so a trusted-proxy setting is
//   needed at deployment time.
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
    const ip = getConnInfo(c).remote.address ?? 'unknown'
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
