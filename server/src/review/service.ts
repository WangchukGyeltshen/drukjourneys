import { prisma } from '../lib/prisma.js'
import { BookingNotFoundError, BookingAccessDeniedError } from '../booking/errors.js'
import { BookingNotReviewableError, ReviewAlreadyExistsError, ReviewNotFoundError } from './errors.js'
import type { CreateReviewInput, UpdateReviewInput } from './schemas.js'

// Owner-only (unlike the invoice endpoint, which allows staff too) — a
// review is the traveler's own opinion, not operational data staff need
// to pull up on someone's behalf.
async function getOwnedConfirmedBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  })
  if (!booking) {
    throw new BookingNotFoundError()
  }
  if (booking.userId !== userId) {
    throw new BookingAccessDeniedError()
  }
  return booking
}

export async function createReview(params: {
  bookingId: string
  userId: string
  input: CreateReviewInput
}) {
  const booking = await getOwnedConfirmedBooking(params.bookingId, params.userId)

  if (booking.status !== 'CONFIRMED') {
    throw new BookingNotReviewableError()
  }
  if (booking.review) {
    throw new ReviewAlreadyExistsError()
  }

  return prisma.review.create({
    data: {
      bookingId: booking.id,
      userId: params.userId,
      ...params.input,
    },
  })
}

// Owner or staff — staff legitimately need to see a review (e.g. to
// follow up on negative feedback), same reasoning as the invoice
// endpoint.
export async function getReviewForBooking(params: { bookingId: string; userId: string; role: string }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { review: true },
  })
  if (!booking) {
    throw new BookingNotFoundError()
  }

  const isOwner = booking.userId === params.userId
  const isStaff = params.role === 'AGENT' || params.role === 'ADMIN'
  if (!isOwner && !isStaff) {
    throw new BookingAccessDeniedError()
  }

  if (!booking.review) {
    throw new ReviewNotFoundError()
  }

  return booking.review
}

export async function updateReview(params: {
  bookingId: string
  userId: string
  input: UpdateReviewInput
}) {
  const booking = await getOwnedConfirmedBooking(params.bookingId, params.userId)

  if (!booking.review) {
    throw new ReviewNotFoundError()
  }

  return prisma.review.update({
    where: { bookingId: booking.id },
    data: params.input,
  })
}

// Public reviews expose a first name and last initial only ("Pema T."),
// never the full name, so a stranger cannot identify a traveler.
export function toPublicReviewerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 'A traveller'
  }
  if (parts.length === 1) {
    return parts[0]
  }
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
}

// Public — reviews are a storefront trust signal (PRD: international
// travelers need "trust signals" before booking), so no auth required.
export async function listReviewsForPackage(packageId: string) {
  const rows = await prisma.review.findMany({
    where: { booking: { packageId } },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      packageRating: true,
      packageComment: true,
      createdAt: true,
      user: { select: { fullName: true } },
    },
  })

  const reviews = rows.map(({ user, ...review }) => ({
    ...review,
    reviewerName: toPublicReviewerName(user.fullName),
  }))

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.packageRating, 0) / reviews.length
      : null

  return { reviews, averageRating, count: reviews.length }
}

// Staff-only — guide performance isn't public storefront content.
export async function listReviewsForGuide(guideId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      guideRating: { not: null },
      booking: { guideAssignment: { guideId } },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      guideRating: true,
      guideComment: true,
      createdAt: true,
      user: { select: { fullName: true } },
    },
  })

  const ratings = reviews.map((r) => r.guideRating!).filter((r) => r !== null)
  const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

  return { reviews, averageRating, count: reviews.length }
}
