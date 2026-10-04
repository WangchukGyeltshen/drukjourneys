import { Hono } from 'hono'
import { getBookingsByRegion, getBookingsBySourceMarket, getBookingsBySeason } from './service.js'
import { requireAuth, requireRole, type AuthVariables } from '../lib/auth-middleware.js'

export const reportRoutes = new Hono<{ Variables: AuthVariables }>()

// Staff-only, same level as guide/vehicle management.
reportRoutes.use('*', requireAuth, requireRole('AGENT', 'ADMIN'))

reportRoutes.get('/bookings-by-region', async (c) => {
  const data = await getBookingsByRegion()
  return c.json({ data })
})

reportRoutes.get('/bookings-by-source-market', async (c) => {
  const data = await getBookingsBySourceMarket()
  return c.json({ data })
})

reportRoutes.get('/bookings-by-season', async (c) => {
  const data = await getBookingsBySeason()
  return c.json({ data })
})
