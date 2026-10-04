import { Hono } from 'hono'
import { createSupportInquirySchema, updateSupportInquiryStatusSchema } from './schemas.js'
import { createSupportInquiry, listSupportInquiries, updateSupportInquiryStatus } from './service.js'
import { SupportInquiryNotFoundError } from './errors.js'
import { requireAuth, requireRole, type AuthVariables } from '../lib/auth-middleware.js'

// Public: a visitor submitting a pre-booking question shouldn't need an
// account first.
export const supportRoutes = new Hono()

supportRoutes.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = createSupportInquirySchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  const inquiry = await createSupportInquiry(result.data)
  return c.json({ inquiry }, 201)
})

// Staff-only triage: listing and resolving inquiries, mounted at a
// separate prefix (/admin/support/inquiries) from the public POST
// above, so its auth middleware never risks shadowing a public route.
export const supportAdminRoutes = new Hono<{ Variables: AuthVariables }>()
supportAdminRoutes.use('*', requireAuth, requireRole('AGENT', 'ADMIN'))

supportAdminRoutes.get('/', async (c) => {
  const inquiries = await listSupportInquiries()
  return c.json({ inquiries })
})

supportAdminRoutes.patch('/:id/status', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = updateSupportInquiryStatusSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const inquiry = await updateSupportInquiryStatus(c.req.param('id'), result.data)
    return c.json({ inquiry })
  } catch (err) {
    if (err instanceof SupportInquiryNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    throw err
  }
})
