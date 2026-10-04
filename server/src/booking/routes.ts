import { Hono } from 'hono'
import { createBookingSchema, calculateBookingSdfSchema, assignGuideSchema } from './schemas.js'
import {
  createBooking,
  listBookingsForUser,
  listAllBookings,
  getBookingForUser,
  calculateAndPersistSdf,
  assignGuide,
  cancelBooking,
} from './service.js'
import {
  PackageNotFoundError,
  InvalidDateRangeError,
  BookingNotFoundError,
  BookingAccessDeniedError,
  InvalidBookingStatusError,
  GuideOrVehicleNotFoundError,
} from './errors.js'
import { requireAuth, requireRole, type AuthVariables } from '../lib/auth-middleware.js'

export const bookingRoutes = new Hono<{ Variables: AuthVariables }>()

// Every booking route requires a logged-in user — there's no such thing
// as an anonymous booking.
bookingRoutes.use('*', requireAuth)

bookingRoutes.post('/', async (c) => {
  const user = c.get('user')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = createBookingSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const booking = await createBooking(user.sub, result.data)
    return c.json({ booking }, 201)
  } catch (err) {
    if (err instanceof PackageNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    if (err instanceof InvalidDateRangeError) {
      return c.json({ error: err.message }, 400)
    }
    throw err
  }
})

bookingRoutes.get('/', async (c) => {
  const user = c.get('user')
  const isStaff = user.role === 'AGENT' || user.role === 'ADMIN'
  const bookings = isStaff ? await listAllBookings() : await listBookingsForUser(user.sub)
  return c.json({ bookings })
})

bookingRoutes.get('/:id', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  try {
    const booking = await getBookingForUser({ bookingId: id, userId: user.sub, role: user.role })
    return c.json({ booking })
  } catch (err) {
    if (err instanceof BookingNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    if (err instanceof BookingAccessDeniedError) {
      return c.json({ error: err.message }, 403)
    }
    throw err
  }
})

bookingRoutes.post('/:id/sdf', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = calculateBookingSdfSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const { booking, sdfRecord } = await calculateAndPersistSdf({
      bookingId: id,
      userId: user.sub,
      role: user.role,
      input: result.data,
    })
    return c.json({ booking, sdfRecord })
  } catch (err) {
    if (err instanceof BookingNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    if (err instanceof BookingAccessDeniedError) {
      return c.json({ error: err.message }, 403)
    }
    if (err instanceof InvalidBookingStatusError) {
      return c.json({ error: err.message }, 409)
    }
    throw err
  }
})

// Staff-only: a tourist cannot assign their own guide/vehicle.
bookingRoutes.patch('/:id/assign-guide', requireRole('AGENT', 'ADMIN'), async (c) => {
  const id = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = assignGuideSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const booking = await assignGuide({ bookingId: id, input: result.data })
    return c.json({ booking })
  } catch (err) {
    if (err instanceof BookingNotFoundError || err instanceof GuideOrVehicleNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    if (err instanceof InvalidBookingStatusError) {
      return c.json({ error: err.message }, 409)
    }
    throw err
  }
})

bookingRoutes.post('/:id/cancel', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  try {
    const booking = await cancelBooking({ bookingId: id, userId: user.sub, role: user.role })
    return c.json({ booking })
  } catch (err) {
    if (err instanceof BookingNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    if (err instanceof BookingAccessDeniedError) {
      return c.json({ error: err.message }, 403)
    }
    if (err instanceof InvalidBookingStatusError) {
      return c.json({ error: err.message }, 409)
    }
    throw err
  }
})
