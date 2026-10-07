import { Hono } from 'hono'
import { prisma } from '../lib/prisma.js'

// Liveness and readiness check for uptime monitors and load balancers
// (NFR-3). Public on purpose: it reveals only "ok" or "unavailable",
// never error text, versions or configuration. The database probe is
// capped at 2 seconds so a hung database reports 503 quickly instead of
// leaving the monitor waiting.
export const healthRoutes = new Hono()

const DB_TIMEOUT_MS = 2000
const startedAt = Date.now()

async function databaseIsUp(): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('timeout')), DB_TIMEOUT_MS)
    })
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout])
    return true
  } catch (err) {
    console.error('Health check: database probe failed', err)
    return false
  } finally {
    clearTimeout(timer)
  }
}

healthRoutes.get('/', async (c) => {
  const dbUp = await databaseIsUp()
  const body = {
    status: dbUp ? 'ok' : 'unavailable',
    database: dbUp ? 'up' : 'down',
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
  }
  return c.json(body, dbUp ? 200 : 503)
})
