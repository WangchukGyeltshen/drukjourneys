// SDF rate table.
//
// IMPORTANT: these figures are illustrative placeholders for development
// and testing, NOT verified against the current official TCB rate
// schedule. Per SRS FR-26 and NFR on configurability, these rates must
// eventually live in the database and be editable by an Admin without a
// code deployment — that's planned for the Admin module (Sprint 6). This
// file is the single place to update them until then.

export type TravelerCategory = 'INTERNATIONAL' | 'INDIAN' | 'BANGLADESHI' | 'MALDIVIAN' | 'DOMESTIC'

export type SdfRate = {
  amountPerNight: number
  currency: 'USD' | 'BTN'
}

export const SDF_RATES: Record<TravelerCategory, SdfRate> = {
  INTERNATIONAL: { amountPerNight: 100, currency: 'USD' },
  INDIAN: { amountPerNight: 1200, currency: 'BTN' },
  BANGLADESHI: { amountPerNight: 1200, currency: 'BTN' },
  MALDIVIAN: { amountPerNight: 1200, currency: 'BTN' },
  DOMESTIC: { amountPerNight: 0, currency: 'BTN' },
}

// Age-based exemptions, applied as a multiplier on the base rate above.
// Under 6: fully exempt. 6–12: half rate. 13+: full rate.
export function exemptionMultiplierForAge(age: number): number {
  if (age < 6) return 0
  if (age <= 12) return 0.5
  return 1
}
