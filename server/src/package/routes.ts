import { Hono } from 'hono'
import { listPackagesQuerySchema } from './schemas.js'
import { listPackages, getPackageById } from './service.js'

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

  const packages = await listPackages(result.data)
  return c.json({ packages })
})

packageRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const pkg = await getPackageById(id)

  if (!pkg) {
    return c.json({ error: 'Package not found' }, 404)
  }

  return c.json({ package: pkg })
})
