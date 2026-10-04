import { Hono, type Context } from 'hono'
import {
  createGuideSchema,
  updateGuideSchema,
  createVehicleSchema,
  updateVehicleSchema,
} from './schemas.js'
import {
  listGuides,
  createGuide,
  getGuideById,
  updateGuide,
  listVehicles,
  createVehicle,
  getVehicleById,
  updateVehicle,
} from './service.js'
import {
  GuideNotFoundError,
  VehicleNotFoundError,
  DuplicateLicenseNumberError,
  DuplicatePlateNumberError,
} from './errors.js'
import { requireAuth, requireRole, type AuthVariables } from '../lib/auth-middleware.js'
import { listReviewsForGuide } from '../review/service.js'

function handleFleetErrors(err: unknown, c: Context) {
  if (err instanceof GuideNotFoundError || err instanceof VehicleNotFoundError) {
    return c.json({ error: err.message }, 404)
  }
  if (err instanceof DuplicateLicenseNumberError || err instanceof DuplicatePlateNumberError) {
    return c.json({ error: err.message }, 409)
  }
  return null
}

// Guide and vehicle management is staff-only (Agent or Admin) — the
// same access level as assigning a guide/vehicle to a booking
// (booking/routes.ts). Each router carries its own requireAuth +
// requireRole scoped to its own mount point, rather than one shared
// router mounted at '/', to avoid the middleware-scope bug fixed in
// SECURITY_NOTES.md (2026-10-04): a '*' middleware mounted at '/'
// catches every request in the app, not just this router's own routes.
export const guideRoutes = new Hono<{ Variables: AuthVariables }>()
guideRoutes.use('*', requireAuth, requireRole('AGENT', 'ADMIN'))

guideRoutes.get('/', async (c) => {
  const guides = await listGuides()
  return c.json({ guides })
})

guideRoutes.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = createGuideSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const guide = await createGuide(result.data)
    return c.json({ guide }, 201)
  } catch (err) {
    const handled = handleFleetErrors(err, c)
    if (handled) return handled
    throw err
  }
})

guideRoutes.get('/:id', async (c) => {
  try {
    const guide = await getGuideById(c.req.param('id'))
    return c.json({ guide })
  } catch (err) {
    const handled = handleFleetErrors(err, c)
    if (handled) return handled
    throw err
  }
})

guideRoutes.patch('/:id', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = updateGuideSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const guide = await updateGuide(c.req.param('id'), result.data)
    return c.json({ guide })
  } catch (err) {
    const handled = handleFleetErrors(err, c)
    if (handled) return handled
    throw err
  }
})

guideRoutes.get('/:id/reviews', async (c) => {
  try {
    const guide = await getGuideById(c.req.param('id'))
    const result = await listReviewsForGuide(guide.id)
    return c.json(result)
  } catch (err) {
    const handled = handleFleetErrors(err, c)
    if (handled) return handled
    throw err
  }
})

export const vehicleRoutes = new Hono<{ Variables: AuthVariables }>()
vehicleRoutes.use('*', requireAuth, requireRole('AGENT', 'ADMIN'))

vehicleRoutes.get('/', async (c) => {
  const vehicles = await listVehicles()
  return c.json({ vehicles })
})

vehicleRoutes.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = createVehicleSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const vehicle = await createVehicle(result.data)
    return c.json({ vehicle }, 201)
  } catch (err) {
    const handled = handleFleetErrors(err, c)
    if (handled) return handled
    throw err
  }
})

vehicleRoutes.get('/:id', async (c) => {
  try {
    const vehicle = await getVehicleById(c.req.param('id'))
    return c.json({ vehicle })
  } catch (err) {
    const handled = handleFleetErrors(err, c)
    if (handled) return handled
    throw err
  }
})

vehicleRoutes.patch('/:id', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = updateVehicleSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const vehicle = await updateVehicle(c.req.param('id'), result.data)
    return c.json({ vehicle })
  } catch (err) {
    const handled = handleFleetErrors(err, c)
    if (handled) return handled
    throw err
  }
})
