import Link from 'next/link'
import { BookingForm } from '@/app/packages/[id]/booking-form'
import type { TourPackage } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth-api'
import { todayIso } from '@/lib/dates'

// Reads the session cookie, so it must render behind a Suspense boundary.
export async function BookTripPanel({ pkg }: { pkg: TourPackage }) {
  const user = await getCurrentUser()
  const here = `/packages/${pkg.id}`

  if (!user) {
    return (
      <div className="mt-6 border-t border-line pt-6">
        <h2 className="font-display text-xl font-semibold">Book this trip</h2>
        <p className="mt-2 text-base">Sign in to choose your dates and book.</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Link
            href={`/login?next=${encodeURIComponent(here)}`}
            className="inline-flex min-h-11 items-center bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep"
          >
            Sign in
          </Link>
          <Link
            href={`/register?next=${encodeURIComponent(here)}`}
            className="text-base font-medium text-brand underline underline-offset-4"
          >
            Create an account
          </Link>
        </div>
      </div>
    )
  }

  return <BookingForm packageId={pkg.id} durationDays={pkg.durationDays} minDate={todayIso()} />
}
