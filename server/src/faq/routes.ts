import { Hono } from 'hono'
import { createFaqEntrySchema, updateFaqEntrySchema } from './schemas.js'
import { listPublicFaqEntries, listAllFaqEntries, createFaqEntry, updateFaqEntry } from './service.js'
import { FaqEntryNotFoundError } from './errors.js'
import { requireAuth, requireRole, type AuthVariables } from '../lib/auth-middleware.js'

export const faqRoutes = new Hono<{ Variables: AuthVariables }>()

// Public: no auth. A visitor deciding whether to book needs to read
// FAQs before they have an account.
faqRoutes.get('/', async (c) => {
  const entries = await listPublicFaqEntries()
  return c.json({ entries })
})

// Everything past this point is Admin-only content management. A
// nested router scoped only to these routes, so the blanket
// requireAuth/requireRole doesn't shadow the public GET / above (same
// mounting-scope lesson as SECURITY_NOTES.md's 2026-10-04 entry).
export const faqAdminRoutes = new Hono<{ Variables: AuthVariables }>()
faqAdminRoutes.use('*', requireAuth, requireRole('ADMIN'))

faqAdminRoutes.get('/', async (c) => {
  const entries = await listAllFaqEntries()
  return c.json({ entries })
})

faqAdminRoutes.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = createFaqEntrySchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  const entry = await createFaqEntry(result.data)
  return c.json({ entry }, 201)
})

faqAdminRoutes.patch('/:id', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = updateFaqEntrySchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const entry = await updateFaqEntry(c.req.param('id'), result.data)
    return c.json({ entry })
  } catch (err) {
    if (err instanceof FaqEntryNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    throw err
  }
})
