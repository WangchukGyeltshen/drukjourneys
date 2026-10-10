import Link from 'next/link'
import type { Pagination } from '@/lib/api'

function hrefFor(query: Record<string, string>, page: number): string {
  const params = new URLSearchParams(query)
  if (page > 1) {
    params.set('page', String(page))
  }
  const suffix = params.toString()
  return suffix ? `/?${suffix}#packages` : '/#packages'
}

const linkClass = 'inline-flex min-h-11 items-center border border-brand px-4 text-base font-medium text-brand hover:bg-brand hover:text-white'

export function PaginationNav({
  pagination,
  query,
}: {
  pagination: Pagination
  query: Record<string, string>
}) {
  if (pagination.totalPages <= 1) {
    return null
  }

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-4">
      {pagination.page > 1 ? (
        <Link href={hrefFor(query, pagination.page - 1)} className={linkClass}>
          Previous page
        </Link>
      ) : null}
      <p className="text-base text-muted">
        Page {pagination.page} of {pagination.totalPages}
      </p>
      {pagination.page < pagination.totalPages ? (
        <Link href={hrefFor(query, pagination.page + 1)} className={linkClass}>
          Next page
        </Link>
      ) : null}
    </nav>
  )
}
