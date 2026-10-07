import { prisma } from '../lib/prisma.js'
import type { Pagination } from '../lib/pagination.js'
import type { ListPackagesQuery } from './schemas.js'

export async function listPackages(query: ListPackagesQuery, pagination: Pagination) {
  const where = {
    // Only ever show active packages to the public browse endpoint —
    // an admin "soft-deleting" a package by setting isActive: false
    // should make it disappear here without touching past bookings.
    isActive: true,
    ...(query.dzongkhag ? { dzongkhag: query.dzongkhag } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.maxDurationDays ? { durationDays: { lte: query.maxDurationDays } } : {}),
    ...(query.maxPrice ? { basePrice: { lte: query.maxPrice } } : {}),
  }
  const [items, total] = await Promise.all([
    prisma.package.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.package.count({ where }),
  ])
  return { items, total }
}

export async function getPackageById(id: string) {
  const pkg = await prisma.package.findUnique({ where: { id } })
  // Same reasoning as listPackages: a retired (isActive: false) package
  // shouldn't be viewable on the public site just because someone has
  // its direct URL. (Internal modules like Booking, once built, will
  // read Package rows directly via Prisma rather than through this
  // public-facing function, so they're unaffected by this filter.)
  if (!pkg?.isActive) {
    return null
  }
  return pkg
}
