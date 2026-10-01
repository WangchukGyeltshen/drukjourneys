import { Hono } from 'hono'
import { calculateSdfSchema } from './schemas.js'
import { calculateSdf } from './engine.js'

export const sdfRoutes = new Hono()

// Public and stateless for now: this is the calculation engine on its
// own, not yet wired to a Booking/SDF_RECORD (that happens once the
// Booking module exists, per our earlier discussion on sprint ordering).
// A traveler should be able to check an estimated SDF before booking
// anything, so keeping this unauthenticated also serves that purpose.
sdfRoutes.post('/calculate', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = calculateSdfSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  return c.json(calculateSdf(result.data))
})
