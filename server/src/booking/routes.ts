import { Hono } from 'hono'
import { parsePagination, paginationMeta } from '../lib/pagination.js'
import { createBookingSchema, calculateBookingSdfSchema, assignGuideSchema } from './schemas.js'
import { createReviewSchema, updateReviewSchema } from '../review/schemas.js'
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
  GuideNotAvailableError,
  VehicleNotAvailableError,
} from './errors.js'
import { requireAuth, requireRole, type AuthVariables } from '../lib/auth-middleware.js'
import { createReview, getReviewForBooking, updateReview } from '../review/service.js'
import { BookingNotReviewableError, ReviewAlreadyExistsError, ReviewNotFoundError } from '../review/errors.js'

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
  const parsed = parsePagination(c.req.query())
  if (!parsed.ok) {
    return c.json({ error: 'Validation failed', details: parsed.details }, 400)
  }
  const { items, total } = isStaff
    ? await listAllBookings(parsed.pagination)
    : await listBookingsForUser(user.sub, parsed.pagination)
  return c.json({ bookings: items, pagination: paginationMeta(total, parsed.pagination) })
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
    if (
      err instanceof InvalidBookingStatusError ||
      err instanceof GuideNotAvailableError ||
      err instanceof VehicleNotAvailableError
    ) {
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

bookingRoutes.post('/:id/review', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = createReviewSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const review = await createReview({ bookingId: id, userId: user.sub, input: result.data })
    return c.json({ review }, 201)
  } catch (err) {
    if (err instanceof BookingNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    if (err instanceof BookingAccessDeniedError) {
      return c.json({ error: err.message }, 403)
    }
    if (err instanceof BookingNotReviewableError || err instanceof ReviewAlreadyExistsError) {
      return c.json({ error: err.message }, 409)
    }
    throw err
  }
})

bookingRoutes.get('/:id/review', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  try {
    const review = await getReviewForBooking({ bookingId: id, userId: user.sub, role: user.role })
    return c.json({ review })
  } catch (err) {
    if (err instanceof BookingNotFoundError || err instanceof ReviewNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    if (err instanceof BookingAccessDeniedError) {
      return c.json({ error: err.message }, 403)
    }
    throw err
  }
})

bookingRoutes.patch('/:id/review', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = updateReviewSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const review = await updateReview({ bookingId: id, userId: user.sub, input: result.data })
    return c.json({ review })
  } catch (err) {
    if (err instanceof BookingNotFoundError || err instanceof ReviewNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    if (err instanceof BookingAccessDeniedError) {
      return c.json({ error: err.message }, 403)
    }
    throw err
  }
})
