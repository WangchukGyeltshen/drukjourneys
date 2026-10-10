import Image from 'next/image'
import Link from 'next/link'
import type { TourPackage } from '@/lib/api'
import { CATEGORY_LABELS, formatDuration, formatPrice } from '@/lib/format'

// `priority` is for the first row of cards, which are above the fold and
// should load straight away.
export function PackageCard({ pkg, priority = false }: { pkg: TourPackage; priority?: boolean }) {
  return (
    <article className="relative flex w-full flex-col border border-line bg-paper transition-colors hover:border-brand">
      {pkg.imageUrl ? (
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-line">
          <Image
            src={pkg.imageUrl}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-5">
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
      </div>
    </article>
  )
}
