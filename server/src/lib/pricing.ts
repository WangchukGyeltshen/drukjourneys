// Package prices are per person, so the package part of a booking is the
// price times the number of travellers. Kept in one place so the payment,
// invoice and reports always agree.
export function packageAmount(basePrice: unknown, travelerCount: number): number {
  return Math.round(Number(basePrice) * travelerCount * 100) / 100
}
