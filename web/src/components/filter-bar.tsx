import Link from 'next/link'
import type { BrowseFilters } from '@/lib/filters'
import { CATEGORIES, CATEGORY_LABELS, DURATION_OPTIONS, DZONGKHAGS } from '@/lib/format'

const fieldClass = 'min-h-11 w-full border border-muted bg-paper px-3 py-2 text-base'
const labelClass = 'mb-1 block text-sm font-semibold'

// A plain GET form: it works without JavaScript, the filters live in the
// URL (so results can be shared or bookmarked), and every control is a
// native, keyboard-accessible element. Submitting drops the page number,
// so a new search always starts on page 1.
export function FilterBar({ filters, showClear }: { filters: BrowseFilters; showClear: boolean }) {
  return (
    <form
      action="/"
      method="get"
      className="grid gap-4 border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
    >
      <div>
        <label htmlFor="dzongkhag" className={labelClass}>
          Dzongkhag
        </label>
        <select id="dzongkhag" name="dzongkhag" defaultValue={filters.dzongkhag ?? ''} className={fieldClass}>
          <option value="">All dzongkhags</option>
          {DZONGKHAGS.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="category" className={labelClass}>
          Type of trip
        </label>
        <select id="category" name="category" defaultValue={filters.category ?? ''} className={fieldClass}>
          <option value="">All types</option>
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="maxDurationDays" className={labelClass}>
          Length of trip
        </label>
        <select
          id="maxDurationDays"
          name="maxDurationDays"
          defaultValue={filters.maxDurationDays ? String(filters.maxDurationDays) : ''}
          className={fieldClass}
        >
          <option value="">Any length</option>
          {DURATION_OPTIONS.map((days) => (
            <option key={days} value={days}>
              Up to {days} days
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="min-h-11 bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep"
        >
          Show packages
        </button>
        {showClear ? (
          <Link href="/" className="text-base font-medium text-brand underline underline-offset-4">
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  )
}
