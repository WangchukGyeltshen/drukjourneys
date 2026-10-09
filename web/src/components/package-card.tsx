import Link from 'next/link'
import type { TourPackage } from '@/lib/api'
import { CATEGORY_COLORS, CATEGORY_LABELS, formatDuration, formatPrice } from '@/lib/format'

export function PackageCard({ pkg }: { pkg: TourPackage }) {
  return (
    <article
      className="relative flex w-full flex-col border border-l-4 border-line bg-paper p-5 transition-colors hover:border-brand"
      style={{ borderLeftColor: CATEGORY_COLORS[pkg.category] }}
    >
      <p className="text-sm font-semibold text-muted">{CATEGORY_LABELS[pkg.category]}</p>
      <h3 className="mt-1 font-display text-xl font-semibold leading-snug">
        {/* The link covers the whole card, so the card is one large tap target. */}
        <Link href={`/packages/${pkg.id}`} className="after:absolute after:inset-0">
          {pkg.title}
        </Link>
      </h3>
      <p className="mt-2 text-base font-medium">
        {pkg.dzongkhag}, {formatDuration(pkg.durationDays)}
      </p>
      <p className="mt-3 line-clamp-3 text-base text-muted">{pkg.description}</p>
      <div className="mt-auto pt-5">
        <p>
          <span className="font-display text-xl font-semibold">
            {formatPrice(pkg.basePrice, pkg.currency)}
          </span>{' '}
          <span className="text-sm text-muted">package price</span>
        </p>
        {pkg.requiresSpecialPermit ? (
          <p className="mt-1 text-sm font-medium text-maroon">Special permit required</p>
        ) : null}
      </div>
    </article>
  )
}
