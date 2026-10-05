import { Hono } from 'hono'
import { parsePagination, paginationMeta } from '../lib/pagination.js'
import { listPackagesQuerySchema } from './schemas.js'
import { listPackages, getPackageById } from './service.js'
import { listReviewsForPackage } from '../review/service.js'

export const packageRoutes = new Hono()

// Public: no requireAuth. Anyone (including a visitor who hasn't signed
// up yet) can browse packages — this is a travel agency's storefront.
packageRoutes.get('/', async (c) => {
  const result = listPackagesQuerySchema.safeParse(c.req.query())
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  const parsed = parsePagination(c.req.query())
  if (!parsed.ok) {
    return c.json({ error: 'Validation failed', details: parsed.details }, 400)
  }
  const { items, total } = await listPackages(result.data, parsed.pagination)
  return c.json({ packages: items, pagination: paginationMeta(total, parsed.pagination) })
})

packageRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const pkg = await getPackageById(id)

  if (!pkg) {
    return c.json({ error: 'Package not found' }, 404)
  }

  return c.json({ package: pkg })
})

// Public — reviews are a storefront trust signal, same reasoning as
// package browsing itself having no auth requirement.
packageRoutes.get('/:id/reviews', async (c) => {
  const id = c.req.param('id')
  const pkg = await getPackageById(id)
  if (!pkg) {
    return c.json({ error: 'Package not found' }, 404)
  }

  const result = await listReviewsForPackage(id)
  return c.json(result)
})
