import { prisma } from '../lib/prisma.js'
import { calculateSdf } from '../sdf/engine.js'
import { sendNotification } from '../notification/service.js'
import type { CreateBookingInput, CalculateBookingSdfInput, AssignGuideInput } from './schemas.js'
import {
  PackageNotFoundError,
  InvalidDateRangeError,
  BookingNotFoundError,
  BookingAccessDeniedError,
  InvalidBookingStatusError,
  GuideOrVehicleNotFoundError,
  GuideNotAvailableError,
  VehicleNotAvailableError,
} from './errors.js'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function nightsBetween(startDate: Date, endDate: Date): number {
  return Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY)
}

export async function createBooking(userId: string, input: CreateBookingInput) {
  if (input.endDate <= input.startDate) {
    throw new InvalidDateRangeError()
  }

  // Re-check the package exists and is active server-side, even though
  // the client presumably only showed active packages — never trust that
  // the client only sent us something it was allowed to see.
  const pkg = await prisma.package.findUnique({ where: { id: input.packageId } })
  if (!pkg || !pkg.isActive) {
    throw new PackageNotFoundError()
  }

  return prisma.booking.create({
    data: {
      userId,
      packageId: input.packageId,
      startDate: input.startDate,
      endDate: input.endDate,
      travelerCount: input.travelerCount,
    },
  })
}

// Tourists see only their own bookings; Agents/Admins see everything.
// The caller decides which to run based on the authenticated user's role.
export async function listBookingsForUser(userId: string) {
  return prisma.booking.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { package: true, sdfRecord: true, guideAssignment: true },
  })
}

export async function listAllBookings() {
  return prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: { package: true, sdfRecord: true, guideAssignment: true },
  })
}

async function getBookingOrThrow(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { package: true, sdfRecord: true, guideAssignment: true },
  })
  if (!booking) {
    throw new BookingNotFoundError()
  }
  return booking
}

// Shared ownership check: a booking is visible to the tourist who made it,
// or to any Agent/Admin. Used by every route below that operates on a
// specific booking id.
export async function getBookingForUser(params: {
  bookingId: string
  userId: string
  role: string
}) {
  const booking = await getBookingOrThrow(params.bookingId)
  const isOwner = booking.userId === params.userId
  const isStaff = params.role === 'AGENT' || params.role === 'ADMIN'
  if (!isOwner && !isStaff) {
    throw new BookingAccessDeniedError()
  }
  return booking
}

export async function calculateAndPersistSdf(params: {
  bookingId: string
  userId: string
  role: string
  input: CalculateBookingSdfInput
}) {
  const booking = await getBookingForUser({
    bookingId: params.bookingId,
    userId: params.userId,
    role: params.role,
  })

  if (booking.status !== 'DRAFT' && booking.status !== 'SDF_CALCULATED') {
    throw new InvalidBookingStatusError(
      'SDF can only be calculated while the booking is in DRAFT or SDF_CALCULATED status'
    )
  }

  // Nights come from the booking's own stored dates, not from client
  // input — this is the one source of truth, so the SDF can't be
  // manipulated by sending a different night count than the actual stay.
  const nights = nightsBetween(booking.startDate, booking.endDate)
  const result = calculateSdf({
    travelerCategory: params.input.travelerCategory,
    nights,
    age: params.input.age,
  })

  const sdfRecord = await prisma.sdfRecord.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      travelerCategory: result.travelerCategory,
      nights: result.nights,
      ratePerNight: result.amountPerNight,
      totalSdf: result.totalSdf,
      currency: result.currency,
    },
    update: {
      travelerCategory: result.travelerCategory,
      nights: result.nights,
      ratePerNight: result.amountPerNight,
      totalSdf: result.totalSdf,
      currency: result.currency,
    },
  })

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'SDF_CALCULATED' },
  })

  // Fire-and-log — see sendNotification's own comment for why this
  // can't fail the request even if the email itself fails.
  await sendNotification({
    userId: booking.userId,
    bookingId: booking.id,
    data: {
      type: 'SDF_CALCULATED',
      packageTitle: booking.package.title,
      nights: result.nights,
      totalSdf: Number(result.totalSdf),
      currency: result.currency,
    },
  })

  return { booking: updatedBooking, sdfRecord }
}

export async function assignGuide(params: { bookingId: string; input: AssignGuideInput }) {
  const booking = await getBookingOrThrow(params.bookingId)

  if (booking.status !== 'SDF_CALCULATED') {
    throw new InvalidBookingStatusError(
      'A guide can only be assigned after the SDF has been calculated for this booking'
    )
  }

  const [guide, vehicle] = await Promise.all([
    prisma.guide.findUnique({ where: { id: params.input.guideId } }),
    prisma.vehicle.findUnique({ where: { id: params.input.vehicleId } }),
  ])

  if (!guide || !vehicle) {
    throw new GuideOrVehicleNotFoundError()
  }

  // Availability is tracked via a simple status flag rather than real
  // date-overlap scheduling — still a known simplification (flagged
  // originally in this function), but now at least prevents double-
  // booking the same guide/vehicle to two bookings at once, which a
  // plain status check catches even without full calendar logic.
  if (guide.status !== 'AVAILABLE') {
    throw new GuideNotAvailableError()
  }
  if (vehicle.status !== 'AVAILABLE') {
    throw new VehicleNotAvailableError()
  }

  // All four writes must succeed or fail together — if the process died
  // between, say, marking the guide ASSIGNED and creating the
  // GuideAssignment record, the guide would be stuck unavailable with
  // nothing actually assigned to them.
  const [, , , updatedBooking] = await prisma.$transaction([
    prisma.guide.update({ where: { id: guide.id }, data: { status: 'ASSIGNED' } }),
    prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: 'ASSIGNED' } }),
    prisma.guideAssignment.create({
      data: {
        bookingId: booking.id,
        guideId: guide.id,
        vehicleId: vehicle.id,
      },
    }),
    prisma.booking.update({
      where: { id: booking.id },
      data: { status: 'GUIDE_ASSIGNED' },
      include: { guideAssignment: { include: { guide: true, vehicle: true } } },
    }),
  ])

  await sendNotification({
    userId: booking.userId,
    bookingId: booking.id,
    data: {
      type: 'GUIDE_ASSIGNED',
      packageTitle: booking.package.title,
      guideName: guide.name,
      vehiclePlate: vehicle.plateNumber,
    },
  })

  return updatedBooking
}

export async function cancelBooking(params: { bookingId: string; userId: string; role: string }) {
  const booking = await getBookingForUser(params)

  if (booking.status === 'CANCELLED') {
    throw new InvalidBookingStatusError('Booking is already cancelled')
  }

  // If a guide/vehicle had been assigned, cancelling the booking must
  // free them back up — otherwise they'd stay stuck ASSIGNED forever
  // with no booking actually using them.
  const notify = () =>
    sendNotification({
      userId: booking.userId,
      bookingId: booking.id,
      data: {
        type: 'BOOKING_CANCELLED',
        packageTitle: booking.package.title,
        startDate: booking.startDate,
        endDate: booking.endDate,
      },
    })

  if (booking.guideAssignment) {
    const [, , updatedBooking] = await prisma.$transaction([
      prisma.guide.update({
        where: { id: booking.guideAssignment.guideId },
        data: { status: 'AVAILABLE' },
      }),
      prisma.vehicle.update({
        where: { id: booking.guideAssignment.vehicleId },
        data: { status: 'AVAILABLE' },
      }),
      prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } }),
    ])
    await notify()
    return updatedBooking
  }

  const cancelledBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: 'CANCELLED' },
  })
  await notify()
  return cancelledBooking
}
