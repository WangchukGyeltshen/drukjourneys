import { Hono } from 'hono'
import { parsePagination, paginationMeta } from '../lib/pagination.js'
import { updateUserRoleSchema } from './schemas.js'
import { listUsers, updateUserRole } from './service.js'
import { UserNotFoundError, CannotModifyOwnRoleError } from './errors.js'
import { requireAuth, requireRole, type AuthVariables } from '../lib/auth-middleware.js'

export const adminRoutes = new Hono<{ Variables: AuthVariables }>()

// Every route in this module is Admin-only. Agents can assign
// guides/vehicles (see booking/routes.ts) but cannot change user roles
// or otherwise administer accounts.
adminRoutes.use('*', requireAuth, requireRole('ADMIN'))

adminRoutes.get('/users', async (c) => {
  const parsed = parsePagination(c.req.query())
  if (!parsed.ok) {
    return c.json({ error: 'Validation failed', details: parsed.details }, 400)
  }
  const { items, total } = await listUsers(parsed.pagination)
  return c.json({ users: items, pagination: paginationMeta(total, parsed.pagination) })
})

adminRoutes.patch('/users/:id/role', async (c) => {
  const actingUser = c.get('user')
  const targetUserId = c.req.param('id')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = updateUserRoleSchema.safeParse(body)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const user = await updateUserRole({
      targetUserId,
      actingUserId: actingUser.sub,
      input: result.data,
    })
    return c.json({ user })
  } catch (err) {
    if (err instanceof UserNotFoundError) {
      return c.json({ error: err.message }, 404)
    }
    if (err instanceof CannotModifyOwnRoleError) {
      return c.json({ error: err.message }, 403)
    }
    throw err
  }
})
