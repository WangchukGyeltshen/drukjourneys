import { Hono } from 'hono'
import { listNotifications } from './service.js'
import { requireAuth, requireRole, type AuthVariables } from '../lib/auth-middleware.js'

// Staff-only audit log — lets an agent/admin confirm a notification
// actually sent, or see why one failed, without digging through server
// logs.
export const notificationRoutes = new Hono<{ Variables: AuthVariables }>()
notificationRoutes.use('*', requireAuth, requireRole('AGENT', 'ADMIN'))

notificationRoutes.get('/', async (c) => {
  const notifications = await listNotifications()
  return c.json({ notifications })
})
