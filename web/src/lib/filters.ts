import type { PackageCategory } from '@/lib/api'
import { CATEGORIES, DURATION_OPTIONS, DZONGKHAGS } from '@/lib/format'

export const PAGE_SIZE = 12

export type RawSearchParams = Record<string, string | string[] | undefined>

export type BrowseFilters = {
  dzongkhag?: string
  category?: PackageCategory
  maxDurationDays?: number
  page: number
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// Anything in the URL is untrusted. Each value is checked against the
// known options, and anything unrecognised is dropped, so the API never
// receives a value it would reject with a 400.
export function parseFilters(raw: RawSearchParams): BrowseFilters {
  const dzongkhagRaw = first(raw.dzongkhag)
  const categoryRaw = first(raw.category)
  const durationRaw = Number(first(raw.maxDurationDays))
  const pageRaw = Number(first(raw.page))

  const dzongkhag = dzongkhagRaw && DZONGKHAGS.includes(dzongkhagRaw) ? dzongkhagRaw : undefined
  const category = CATEGORIES.find((value) => value === categoryRaw)
  const maxDurationDays = DURATION_OPTIONS.includes(durationRaw) ? durationRaw : undefined
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 && pageRaw <= 1000 ? pageRaw : 1

  return { dzongkhag, category, maxDurationDays, page }
}

// Query string for links that keep the current filters (used by pagination).
export function toQuery(filters: BrowseFilters): Record<string, string> {
  const query: Record<string, string> = {}
  if (filters.dzongkhag) query.dzongkhag = filters.dzongkhag
  if (filters.category) query.category = filters.category
  if (filters.maxDurationDays) query.maxDurationDays = String(filters.maxDurationDays)
  return query
}
