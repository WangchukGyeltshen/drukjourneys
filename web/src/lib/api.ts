import { cacheLife } from 'next/cache'

// Server-side API client. API_BASE_URL has no NEXT_PUBLIC_ prefix on
// purpose: it stays on the server and is never sent to the browser.
const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000'

export type PackageCategory =
  | 'CULTURAL'
  | 'TREKKING'
  | 'FESTIVAL'
  | 'PILGRIMAGE'
  | 'ADVENTURE'
  | 'WELLNESS'

export type TourPackage = {
  id: string
  title: string
  description: string
  dzongkhag: string
  category: PackageCategory
  durationDays: number
  // Prisma Decimal values arrive as strings in JSON.
  basePrice: string
  currency: string
  requiresSpecialPermit: boolean
  imageUrl: string | null
  createdAt: string
}

export type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type PackageFilters = {
  dzongkhag?: string
  category?: PackageCategory
  maxDurationDays?: number
  maxPrice?: number
  page?: number
  pageSize?: number
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new ApiError(response.status, `API request failed: ${response.status} ${path}`)
  }
  return (await response.json()) as T
}

// Public package listing. Cached for a few minutes: the catalogue changes
// rarely, and this keeps repeat visitors off the database (NFR-1).
export async function listPackages(filters: PackageFilters = {}) {
  'use cache'
  cacheLife('minutes')

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : ''
  return apiGet<{ packages: TourPackage[]; pagination: Pagination }>(`/packages${suffix}`)
}

// Returns null when the package does not exist or has been retired.
export async function getPackage(id: string) {
  'use cache'
  cacheLife('minutes')

  try {
    const data = await apiGet<{ package: TourPackage }>(`/packages/${encodeURIComponent(id)}`)
    return data.package
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

export type PackageReview = {
  id: string
  packageRating: number
  packageComment: string | null
  createdAt: string
  reviewerName: string
}

export type PackageReviews = {
  reviews: PackageReview[]
  averageRating: number | null
  count: number
}

export async function getPackageReviews(id: string) {
  'use cache'
  cacheLife('minutes')

  return apiGet<PackageReviews>(`/packages/${encodeURIComponent(id)}/reviews`)
}
