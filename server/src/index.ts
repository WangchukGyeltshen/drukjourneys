import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { authRoutes } from './auth/routes.js'
import { packageRoutes } from './package/routes.js'
import { sdfRoutes } from './sdf/routes.js'
import { documentRoutes } from './document/routes.js'
import { bookingRoutes } from './booking/routes.js'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ message: 'DrukJourneys API is running' })
})

app.route('/auth', authRoutes)
app.route('/packages', packageRoutes)
app.route('/sdf', sdfRoutes)
app.route('/documents', documentRoutes)
app.route('/bookings', bookingRoutes)

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
