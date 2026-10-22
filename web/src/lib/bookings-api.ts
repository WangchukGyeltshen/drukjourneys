import { API_BASE_URL, type TourPackage } from '@/lib/api'
import { getAccessToken } from '@/lib/session'
import type { TravelerCategory } from '@/lib/booking-labels'

export type BookingStatus = 'DRAFT' | 'SDF_CALCULATED' | 'GUIDE_ASSIGNED' | 'CONFIRMED' | 'CANCELLED'

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  DRAFT: 'Draft',
  SDF_CALCULATED: 'Fee calculated',
  GUIDE_ASSIGNED: 'Guide assigned',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
}

export { TRAVELER_CATEGORY_LABELS, type TravelerCategory } from '@/lib/booking-labels'

export type SdfRecord = {
  travelerCategory: TravelerCategory
  travelerAges: number[]
  nights: number
  ratePerNight: string
  totalSdf: string
  currency: string
}

export type GuideAssignment = {
  guide: { name: string }
  vehicle: { type: string; plateNumber: string }
}

export type Booking = {
  id: string
  packageId: string
  status: BookingStatus
  startDate: string
  endDate: string
  travelerCount: number
  createdAt: string
  package: TourPackage
  sdfRecord: SdfRecord | null
  guideAssignment: GuideAssignment | null
}

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; status: number; error: string }

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response | null> {
  const token = await getAccessToken()
  if (!token) {
    return null
  }
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
}

export async function createBooking(input: {
  packageId: string
  startDate: string
  endDate: string
  travelerCount: number
}): Promise<CreateBookingResult> {
  let response: Response | null
  try {
    response = await authedFetch('/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    return { ok: false, status: 0, error: 'We could not reach the server. Please try again.' }
  }
  if (!response) {
    return { ok: false, status: 401, error: 'Please sign in to book.' }
  }
  const data = (await response.json().catch(() => null)) as { booking?: Booking; error?: string } | null
  if (response.ok && data?.booking) {
    return { ok: true, booking: data.booking }
  }
  return { ok: false, status: response.status, error: data?.error ?? 'Something went wrong. Please try again.' }
}

// Returns the booking, "signed-out" when there is no valid session, or
// null when it does not exist or belongs to someone else.
export async function getBooking(id: string): Promise<Booking | 'signed-out' | null> {
  let response: Response | null
  try {
    response = await authedFetch(`/bookings/${encodeURIComponent(id)}`)
  } catch {
    throw new Error('Could not reach the booking service')
  }
  if (!response || response.status === 401) {
    return 'signed-out'
  }
  if (response.status === 404 || response.status === 403 || response.status === 400) {
    return null
  }
  if (!response.ok) {
    throw new Error(`Booking request failed with status ${response.status}`)
  }
  const data = (await response.json()) as { booking: Booking }
  return data.booking
}

export type CalculateFeeResult = { ok: true } | { ok: false; status: number; error: string }

export async function calculateFee(
  bookingId: string,
  input: { travelerCategory: TravelerCategory; ages: number[] },
): Promise<CalculateFeeResult> {
  let response: Response | null
  try {
    response = await authedFetch(`/bookings/${encodeURIComponent(bookingId)}/sdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    return { ok: false, status: 0, error: 'We could not reach the server. Please try again.' }
  }
  if (!response) {
    return { ok: false, status: 401, error: 'Please sign in again.' }
  }
  if (response.ok) {
    return { ok: true }
  }
  const data = (await response.json().catch(() => null)) as { error?: string } | null
  return { ok: false, status: response.status, error: data?.error ?? 'Something went wrong. Please try again.' }
}

export type BookingList = { bookings: Booking[]; total: number }

// The signed-in traveller's bookings, newest first. Returns "signed-out"
// when there is no valid session.
export async function listMyBookings(): Promise<BookingList | 'signed-out'> {
  let response: Response | null
  try {
    response = await authedFetch('/bookings?pageSize=50')
  } catch {
    throw new Error('Could not reach the booking service')
  }
  if (!response || response.status === 401) {
    return 'signed-out'
  }
  if (!response.ok) {
    throw new Error(`Booking list request failed with status ${response.status}`)
  }
  const data = (await response.json()) as { bookings: Booking[]; pagination: { total: number } }
  return { bookings: data.bookings, total: data.pagination.total }
}

export type CancelBookingResult = { ok: true } | { ok: false; status: number; error: string }

export async function cancelBooking(bookingId: string): Promise<CancelBookingResult> {
  let response: Response | null
  try {
    response = await authedFetch(`/bookings/${encodeURIComponent(bookingId)}/cancel`, { method: 'POST' })
  } catch {
    return { ok: false, status: 0, error: 'We could not reach the server. Please try again.' }
  }
  if (!response) {
    return { ok: false, status: 401, error: 'Please sign in again.' }
  }
  if (response.ok) {
    return { ok: true }
  }
  const data = (await response.json().catch(() => null)) as { error?: string } | null
  return { ok: false, status: response.status, error: data?.error ?? 'Something went wrong. Please try again.' }
}
