import { prisma } from '../lib/prisma.js'

// Meteorological season buckets. Bhutan's peak tourist season is spring
// and autumn (per the PRD's risk register), so grouping by season
// rather than raw month makes that pattern visible directly in the
// report instead of requiring the reader to mentally group 12 months.
const SEASON_BY_MONTH: Record<number, 'Spring' | 'Summer' | 'Autumn' | 'Winter'> = {
  0: 'Winter',
  1: 'Winter',
  2: 'Spring',
  3: 'Spring',
  4: 'Spring',
  5: 'Summer',
  6: 'Summer',
  7: 'Summer',
  8: 'Autumn',
  9: 'Autumn',
  10: 'Autumn',
  11: 'Winter',
}

const SEASON_ORDER = ['Spring', 'Summer', 'Autumn', 'Winter'] as const

// Only CONFIRMED bookings count toward TCB-aligned reporting — these
// are bookings that were actually paid for, i.e. real tourist arrivals,
// as opposed to DRAFT/SDF_CALCULATED/GUIDE_ASSIGNED bookings still in
// progress or CANCELLED ones that never happened.
function getConfirmedBookingsForReporting() {
  return prisma.booking.findMany({
    where: { status: 'CONFIRMED' },
    include: { package: true, sdfRecord: true },
  })
}

// Package cost + SDF, matching the same total used on the invoice
// endpoint (payment/service.ts's getInvoiceForBooking), so the two
// stay consistent with each other.
function revenueFor(booking: {
  package: { basePrice: unknown }
  sdfRecord: { totalSdf: unknown } | null
}): number {
  const packageAmount = Number(booking.package.basePrice)
  const sdfAmount = booking.sdfRecord ? Number(booking.sdfRecord.totalSdf) : 0
  return packageAmount + sdfAmount
}

export async function getBookingsByRegion() {
  const bookings = await getConfirmedBookingsForReporting()

  const groups = new Map<string, { count: number; revenue: number }>()
  for (const booking of bookings) {
    const key = booking.package.dzongkhag
    const existing = groups.get(key) ?? { count: 0, revenue: 0 }
    existing.count += 1
    existing.revenue += revenueFor(booking)
    groups.set(key, existing)
  }

  return Array.from(groups, ([region, stats]) => ({ region, ...stats })).sort(
    (a, b) => b.count - a.count
  )
}

export async function getBookingsBySourceMarket() {
  const bookings = await getConfirmedBookingsForReporting()

  const groups = new Map<string, { count: number; revenue: number }>()
  for (const booking of bookings) {
    // travelerCategory comes from the SDF record (INTERNATIONAL,
    // INDIAN, BANGLADESHI, MALDIVIAN, DOMESTIC) — this is the
    // TCB-recognized categorization, more useful for compliance
    // reporting than the freeform User.nationality text field.
    const key = booking.sdfRecord?.travelerCategory ?? 'UNKNOWN'
    const existing = groups.get(key) ?? { count: 0, revenue: 0 }
    existing.count += 1
    existing.revenue += revenueFor(booking)
    groups.set(key, existing)
  }

  return Array.from(groups, ([sourceMarket, stats]) => ({ sourceMarket, ...stats })).sort(
    (a, b) => b.count - a.count
  )
}

export async function getBookingsBySeason() {
  const bookings = await getConfirmedBookingsForReporting()

  const groups = new Map<string, { count: number; revenue: number }>(
    SEASON_ORDER.map((season) => [season, { count: 0, revenue: 0 }])
  )

  for (const booking of bookings) {
    // Season is based on the trip's startDate (when the tourist actually
    // travels), not createdAt (when the booking was made) — TCB cares
    // about seasonal visitor load, not booking-office activity.
    const month = new Date(booking.startDate).getUTCMonth()
    const key = SEASON_BY_MONTH[month]
    const existing = groups.get(key)!
    existing.count += 1
    existing.revenue += revenueFor(booking)
  }

  // Always returns all 4 seasons, even at zero, so a dashboard chart
  // doesn't need to handle a missing category.
  return SEASON_ORDER.map((season) => ({ season, ...groups.get(season)! }))
}
