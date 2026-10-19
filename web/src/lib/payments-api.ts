import { API_BASE_URL } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

type Failure = { ok: false; status: number; error: string }

async function postForBooking(bookingId: string, path: string): Promise<{ ok: true; data: unknown } | Failure> {
  const token = await getAccessToken()
  if (!token) {
    return { ok: false, status: 401, error: 'Please sign in again.' }
  }
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/bookings/${encodeURIComponent(bookingId)}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
  } catch {
    return { ok: false, status: 0, error: 'We could not reach the server. Please try again.' }
  }
  const data = (await response.json().catch(() => null)) as { error?: string } | null
  if (!response.ok) {
    return { ok: false, status: response.status, error: data?.error ?? 'Something went wrong. Please try again.' }
  }
  return { ok: true, data }
}

export async function createPaymentIntent(bookingId: string): Promise<{ ok: true; clientSecret: string } | Failure> {
  const result = await postForBooking(bookingId, '/payments/intent')
  if (!result.ok) {
    return result
  }
  const clientSecret = (result.data as { clientSecret?: string | null }).clientSecret
  if (!clientSecret) {
    return { ok: false, status: 500, error: 'The payment could not be started. Please try again.' }
  }
  return { ok: true, clientSecret }
}

// Asks the API to check the payment with Stripe and confirm the booking.
// Needed while there is no public webhook URL (local development); in
// production the Stripe webhook does the same job.
export async function syncPayment(bookingId: string): Promise<{ ok: true; paid: boolean } | Failure> {
  const result = await postForBooking(bookingId, '/payments/sync')
  if (!result.ok) {
    return result
  }
  const payment = (result.data as { payment?: { status?: string } }).payment
  return { ok: true, paid: payment?.status === 'SUCCEEDED' }
}
