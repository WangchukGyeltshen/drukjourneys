import { SDF_RATES, exemptionMultiplierForAge, type TravelerCategory } from './rates.js'

export type SdfCalculationInput = {
  travelerCategory: TravelerCategory
  nights: number
  age: number
}

export type SdfCalculationResult = {
  travelerCategory: TravelerCategory
  nights: number
  amountPerNight: number
  exemptionMultiplier: number
  totalSdf: number
  currency: 'USD' | 'BTN'
}

// Pure function: same input always produces the same output, no database
// or network access. This makes it trivial to unit test (see STLC
// TC-01/TC-02/TC-03) and reusable later from the Booking module once
// SDF records are tied to a real booking.
export function calculateSdf(input: SdfCalculationInput): SdfCalculationResult {
  const rate = SDF_RATES[input.travelerCategory]
  const multiplier = exemptionMultiplierForAge(input.age)
  const totalSdf = rate.amountPerNight * input.nights * multiplier

  return {
    travelerCategory: input.travelerCategory,
    nights: input.nights,
    amountPerNight: rate.amountPerNight,
    exemptionMultiplier: multiplier,
    // Rounded to 2 decimal places to avoid floating-point artifacts
    // (e.g. 100 * 5 * 0.5 = 250, but not every combination is this clean).
    totalSdf: Math.round(totalSdf * 100) / 100,
    currency: rate.currency,
  }
}
