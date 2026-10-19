import { prisma } from '../lib/prisma.js'
import { packageAmount } from '../lib/pricing.js'
import { stripe } from '../lib/stripe.js'
import {
  InvalidBookingStatusForPaymentError,
  UnsupportedCurrencyForStripeError,
  PaymentAlreadyExistsError,
  InvoiceNotAvailableError,
  MissingDocumentsError,
} from './errors.js'
import { BookingNotFoundError, BookingAccessDeniedError } from '../booking/errors.js'
import { sendNotification } from '../notification/service.js'

const REQUIRED_DOCUMENT_TYPES = ['PASSPORT', 'VISA', 'PHOTO'] as const

async function getOwnedBookingWithRelations(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { package: true, sdfRecord: true, payment: true },
  })
  if (!booking) {
    throw new BookingNotFoundError()
  }
  if (booking.userId !== userId) {
    throw new BookingAccessDeniedError()
  }
  return booking
}

export async function createPaymentIntentForBooking(params: { bookingId: string; userId: string }) {
  const booking = await getOwnedBookingWithRelations(params.bookingId, params.userId)

  if (booking.status !== 'GUIDE_ASSIGNED') {
    throw new InvalidBookingStatusForPaymentError(
      'Payment can only be started once a guide has been assigned to this booking'
    )
  }

  if (booking.payment) {
    // A payment that was started but not finished (for example the page was
    // reloaded) can be resumed with the same Stripe PaymentIntent.
    if (booking.payment.status === 'PENDING' && booking.payment.providerRef) {
      const existing = await stripe.paymentIntents.retrieve(booking.payment.providerRef)
      return { payment: booking.payment, clientSecret: existing.client_secret }
    }
    throw new PaymentAlreadyExistsError()
  }

  // Passport, visa and photo must be on file, and the newest upload of
  // each must not have been rejected by staff.
  const documents = await prisma.document.findMany({
    where: { userId: booking.userId, docType: { in: [...REQUIRED_DOCUMENT_TYPES] } },
    orderBy: { uploadedAt: 'desc' },
  })
  const missing = REQUIRED_DOCUMENT_TYPES.filter((docType) => {
    const latest = documents.find((document) => document.docType === docType)
    return !latest || latest.status === 'REJECTED'
  })
  if (missing.length > 0) {
    throw new MissingDocumentsError(missing.map((docType) => docType.toLowerCase()))
  }

  // sdfRecord is guaranteed to exist here — a booking can't reach
  // GUIDE_ASSIGNED without passing through SDF_CALCULATED first, which
  // is enforced in booking/service.ts's assignGuide().
  const sdfRecord = booking.sdfRecord!

  if (booking.package.currency !== 'USD' || sdfRecord.currency !== 'USD') {
    throw new UnsupportedCurrencyForStripeError()
  }

  const totalUsd = packageAmount(booking.package.basePrice, booking.travelerCount) + Number(sdfRecord.totalSdf)

  // Stripe amounts are integers in the currency's smallest unit — cents
  // for USD, not dollars. Multiplying a float by 100 can introduce
  // rounding artifacts (e.g. 19.999999999998), so we round explicitly.
  const amountInCents = Math.round(totalUsd * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    metadata: { bookingId: booking.id },
    // We only support card payments here, confirmed via Stripe Elements
    // on a future frontend (or directly via the API during testing).
    // Without this, Stripe's default "automatic payment methods" setting
    // also enables redirect-based methods (Klarna, Amazon Pay, etc.),
    // which would require a return_url we have no real page for yet.
    automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
  })

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: totalUsd,
      currency: 'USD',
      method: 'STRIPE',
      status: 'PENDING',
      providerRef: paymentIntent.id,
    },
  })

  return { payment, clientSecret: paymentIntent.client_secret }
}

// DEVELOPMENT CONVENIENCE: without a public URL, Stripe's webhook can't
// reach this machine, so there's no automatic notification when a test
// payment succeeds. This function instead actively asks Stripe for the
// PaymentIntent's current status and syncs our record to match. The
// webhook handler below remains the correct mechanism for a real
// deployment — this is a stand-in for local testing only.
export async function syncPaymentStatus(params: { bookingId: string; userId: string }) {
  const booking = await getOwnedBookingWithRelations(params.bookingId, params.userId)

  if (!booking.payment) {
    throw new InvalidBookingStatusForPaymentError('No payment has been started for this booking yet')
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(booking.payment.providerRef!)

  if (paymentIntent.status === 'succeeded' && booking.payment.status !== 'SUCCEEDED') {
    const [payment, updatedBooking] = await Promise.all([
      prisma.payment.update({ where: { id: booking.payment.id }, data: { status: 'SUCCEEDED' } }),
      prisma.booking.update({ where: { id: booking.id }, data: { status: 'CONFIRMED' } }),
    ])
    await sendNotification({
      userId: booking.userId,
      bookingId: booking.id,
      data: {
        type: 'BOOKING_CONFIRMED',
        packageTitle: booking.package.title,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPaid: Number(payment.amount),
        currency: payment.currency,
      },
    })
    return { payment, booking: updatedBooking }
  }

  if (paymentIntent.status === 'canceled' && booking.payment.status !== 'FAILED') {
    const payment = await prisma.payment.update({
      where: { id: booking.payment.id },
      data: { status: 'FAILED' },
    })
    return { payment, booking }
  }

  return { payment: booking.payment, booking }
}

// Real production path: Stripe calls this endpoint directly when a
// payment's status changes, authenticated via a signature rather than a
// logged-in user (Stripe isn't a user of our app).
export async function applyPaymentIntentSucceeded(paymentIntentId: string) {
  const payment = await prisma.payment.findUnique({
    where: { providerRef: paymentIntentId },
    include: { booking: { include: { package: true } } },
  })
  if (!payment) return

  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCEEDED' } })
  await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: 'CONFIRMED' } })

  await sendNotification({
    userId: payment.booking.userId,
    bookingId: payment.booking.id,
    data: {
      type: 'BOOKING_CONFIRMED',
      packageTitle: payment.booking.package.title,
      startDate: payment.booking.startDate,
      endDate: payment.booking.endDate,
      totalPaid: Number(payment.amount),
      currency: payment.currency,
    },
  })
}

export async function applyPaymentIntentFailed(paymentIntentId: string) {
  const payment = await prisma.payment.findUnique({ where: { providerRef: paymentIntentId } })
  if (!payment) return

  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } })
}


// Unlike getOwnedBookingWithRelations (used for starting/checking a
// payment, which is intentionally owner-only — an agent should not be
// able to pay on a traveler's behalf), an invoice is read-only
// information that staff legitimately need to pull up on a traveler's
// behalf, so this follows the same owner-or-staff pattern used
// elsewhere in the booking module.
export async function getInvoiceForBooking(params: { bookingId: string; userId: string; role: string }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { package: true, sdfRecord: true, payment: true },
  })
  if (!booking) {
    throw new BookingNotFoundError()
  }

  const isOwner = booking.userId === params.userId
  const isStaff = params.role === 'AGENT' || params.role === 'ADMIN'
  if (!isOwner && !isStaff) {
    throw new BookingAccessDeniedError()
  }

  // An invoice needs the SDF line item, which doesn't exist until the
  // booking has passed through SDF_CALCULATED.
  if (!booking.sdfRecord) {
    throw new InvoiceNotAvailableError()
  }

  const packageLineItem = {
    description: `Package: ${booking.package.title} (${booking.travelerCount} traveller${booking.travelerCount === 1 ? '' : 's'})`,
    amount: packageAmount(booking.package.basePrice, booking.travelerCount),
    currency: booking.package.currency,
  }
  const sdfLineItem = {
    description: 'Sustainable Development Fee (SDF)',
    amount: booking.sdfRecord.totalSdf,
    currency: booking.sdfRecord.currency,
  }

  // Amounts are Prisma Decimal values — Number() here is safe for
  // display/arithmetic purposes (these are small, bounded currency
  // amounts, not values where float precision could matter at scale).
  const total = Number(packageLineItem.amount) + Number(sdfLineItem.amount)

  return {
    bookingId: booking.id,
    bookingStatus: booking.status,
    lineItems: [packageLineItem, sdfLineItem],
    total,
    currency: packageLineItem.currency,
    payment: booking.payment
      ? {
          status: booking.payment.status,
          method: booking.payment.method,
          paidAt: booking.payment.status === 'SUCCEEDED' ? booking.payment.updatedAt : null,
        }
      : null,
  }
}
