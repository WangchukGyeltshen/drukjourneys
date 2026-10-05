import { z } from 'zod'

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100 // caps how much one request can pull (NFR-9)

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})

export type Pagination = {
  page: number
  pageSize: number
  skip: number // rows to skip, for Prisma
  take: number // rows to return, for Prisma
}

// Reads ?page= and ?pageSize= from the query string. Missing values fall
// back to page 1 and DEFAULT_PAGE_SIZE; bad values return the same
// "Validation failed" shape the other routes use.
export function parsePagination(query: Record<string, string | undefined>) {
  const result = paginationQuerySchema.safeParse(query)
  if (!result.success) {
    return { ok: false as const, details: result.error.flatten().fieldErrors }
  }
  const { page, pageSize } = result.data
  return {
    ok: true as const,
    pagination: { page, pageSize, skip: (page - 1) * pageSize, take: pageSize } satisfies Pagination,
  }
}

export function paginationMeta(total: number, p: Pagination) {
  return {
    page: p.page,
    pageSize: p.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / p.pageSize)),
  }
}
