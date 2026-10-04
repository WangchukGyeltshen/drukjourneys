import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set — check your .env file')
}

// NOTE: apiVersion intentionally omitted here — Stripe's SDK requires an
// exact version string matching what the installed package's TypeScript
// types expect, and guessing wrong fails the build. This uses your
// Stripe account's current default API version instead. Pinning an
// explicit apiVersion (so behavior doesn't shift if Stripe's default
// ever changes) is a worthwhile follow-up once we can verify the exact
// string against `npx tsc --noEmit`.
export const stripe = new Stripe(STRIPE_SECRET_KEY)
