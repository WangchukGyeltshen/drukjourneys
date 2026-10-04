import { Hono, type Context } from 'hono'
import { stripe } from '../lib/stripe.js'
import {
  createPaymentIntentForBooking,
  syncPaymentStatus,
  applyPaymentIntentSucceeded,
  applyPaymentIntentFailed,
} from './service.js'
import {
  InvalidBookingStatusForPaymentError,
  UnsupportedCurrencyForStripeError,
  PaymentAlreadyExistsError,
} from './errors.js'
import { BookingNotFoundError, BookingAccessDeniedError } from '../booking/errors.js'
import { requireAuth, type AuthVariables } from '../lib/auth-middleware.js'

function handleSharedErrors(err: unknown, c: Context) {
  if (err instanceof BookingNotFoundError) {
    return c.json({ error: err.message }, 404)
  }
  if (err instanceof BookingAccessDeniedError) {
    return c.json({ error: err.message }, 403)
  }
  if (
    err instanceof InvalidBookingStatusForPaymentError ||
    err instanceof UnsupportedCurrencyForStripeError ||
    err instanceof PaymentAlreadyExistsError
  ) {
    return c.json({ error: err.message }, 409)
  }
  return null
}

// Everything except the webhook requires a logged-in user. The webhook
// is mounted separately below, before this blanket requireAuth.
export const authedPaymentRoutes = new Hono<{ Variables: AuthVariables }>()
authedPaymentRoutes.use('*', requireAuth)

authedPaymentRoutes.post('/:id/payments/intent', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  try {
    const { payment, clientSecret } = await createPaymentIntentForBooking({
      bookingId: id,
      userId: user.sub,
    })
    return c.json({ payment, clientSecret }, 201)
  } catch (err) {
    const handled = handleSharedErrors(err, c)
    if (handled) return handled
    throw err
  }
})

// DEV-ONLY convenience endpoint — see the comment on syncPaymentStatus
// in service.ts for why this exists alongside the webhook.
authedPaymentRoutes.post('/:id/payments/sync', async (c) => {
  const user = c.get('user')
  const id = c.req.param('id')

  try {
    const { payment, booking } = await syncPaymentStatus({ bookingId: id, userId: user.sub })
    return c.json({ payment, booking })
  } catch (err) {
    const handled = handleSharedErrors(err, c)
    if (handled) return handled
    throw err
  }
})

export const stripeWebhookRoutes = new Hono()

stripeWebhookRoutes.post('/webhook', async (c) => {
  const signature = c.req.header('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    // Not configured yet in local development — see README for how to
    // set this up with the Stripe CLI once needed. We deliberately don't
    // silently accept unverified events even in this case.
    return c.json({ error: 'Webhook not configured' }, 501)
  }

  if (!signature) {
    return c.json({ error: 'Missing stripe-signature header' }, 400)
  }

  // IMPORTANT: Stripe signs the exact raw request body. If this had
  // already been parsed as JSON and re-serialized, the signature check
  // would fail even for a legitimate event — so we read it as raw text,
  // never c.req.json(), before verifying.
  const rawBody = await c.req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch {
    return c.json({ error: 'Invalid webhook signature' }, 400)
  }

  if (event.type === 'payment_intent.succeeded') {
    await applyPaymentIntentSucceeded(event.data.object.id)
  } else if (event.type === 'payment_intent.payment_failed') {
    await applyPaymentIntentFailed(event.data.object.id)
  }

  return c.json({ received: true })
})

