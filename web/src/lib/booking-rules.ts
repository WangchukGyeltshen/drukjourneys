// Rules the booking form shares with the API. The API enforces them too;
// these copies only give the visitor quick, friendly feedback.
export const MAX_TRAVELERS = 20

// A package of N days is N - 1 nights, so the trip ends N - 1 days after
// it starts.
export function lastDayOffset(durationDays: number): number {
  return Math.max(durationDays - 1, 1)
}
