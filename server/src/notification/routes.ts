import { Hono } from 'hono'
import { parsePagination, paginationMeta } from '../lib/pagination.js'
import { listNotifications } from './service.js'
import { requireAuth, requireRole, type AuthVariables } from '../lib/auth-middleware.js'

// Staff-only audit log — lets an agent/admin confirm a notification
// actually sent, or see why one failed, without digging through server
// logs.
export const notificationRoutes = new Hono<{ Variables: AuthVariables }>()
notificationRoutes.use('*', requireAuth, requireRole('AGENT', 'ADMIN'))

notificationRoutes.get('/', async (c) => {
  const parsed = parsePagination(c.req.query())
  if (!parsed.ok) {
    return c.json({ error: 'Validation failed', details: parsed.details }, 400)
  }
  const { items, total } = await listNotifications(parsed.pagination)
  return c.json({ notifications: items, pagination: paginationMeta(total, parsed.pagination) })
})
