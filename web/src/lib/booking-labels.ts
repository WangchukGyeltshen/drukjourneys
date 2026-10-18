// Plain constants with no server imports, so client components can use them.
export type TravelerCategory = 'INTERNATIONAL' | 'INDIAN' | 'BANGLADESHI' | 'MALDIVIAN' | 'DOMESTIC'

export const TRAVELER_CATEGORY_LABELS: Record<TravelerCategory, string> = {
  INTERNATIONAL: 'International visitor',
  INDIAN: 'Indian national',
  BANGLADESHI: 'Bangladeshi national',
  MALDIVIAN: 'Maldivian national',
  DOMESTIC: 'Bhutanese resident',
}
