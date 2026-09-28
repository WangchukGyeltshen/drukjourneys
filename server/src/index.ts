import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.json({ message: 'DrukJourneys API is running(v2)' })
})

const port = 3000
console.log(`Server starting on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
