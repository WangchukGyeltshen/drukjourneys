import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { authRoutes } from './auth/routes.js'
import { packageRoutes } from './package/routes.js'
import { sdfRoutes } from './sdf/routes.js'
import { documentRoutes } from './document/routes.js'
import { bookingRoutes } from './booking/routes.js'
import { authedPaymentRoutes, stripeWebhookRoutes } from './payment/routes.js'
import { adminRoutes } from './admin/routes.js'
import { guideRoutes, vehicleRoutes } from './fleet/routes.js'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ message: 'DrukJourneys API is running' })
})

app.route('/auth', authRoutes)
app.route('/packages', packageRoutes)
app.route('/sdf', sdfRoutes)
app.route('/documents', documentRoutes)
app.route('/bookings', bookingRoutes)

// authedPaymentRoutes defines routes like /:id/payments/intent, meant
// to live under /bookings/:id/payments/... . It carries its own
// requireAuth middleware scoped to this prefix — it must NOT be mounted
// at '/', or that middleware would intercept every request in the app,
// including the unauthenticated Stripe webhook below.
app.route('/bookings', authedPaymentRoutes)
app.route('/payments', stripeWebhookRoutes)
app.route('/admin', adminRoutes)
app.route('/guides', guideRoutes)
app.route('/vehicles', vehicleRoutes)

// Global error handler: catches anything not already caught inside a
// route (malformed JSON bodies, unexpected database errors, etc.) and
// returns a generic response instead of leaking internal error details
// (stack traces, database error messages) to the client.
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Something went wrong' }, 500)
})

const port = 3000
console.log(`Server starting on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
