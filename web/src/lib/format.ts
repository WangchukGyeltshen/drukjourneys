import type { PackageCategory } from '@/lib/api'

export const CATEGORIES: readonly PackageCategory[] = [
  'CULTURAL',
  'TREKKING',
  'FESTIVAL',
  'PILGRIMAGE',
  'ADVENTURE',
  'WELLNESS',
]

export const CATEGORY_LABELS: Record<PackageCategory, string> = {
  CULTURAL: 'Cultural',
  TREKKING: 'Trekking',
  FESTIVAL: 'Festival',
  PILGRIMAGE: 'Pilgrimage',
  ADVENTURE: 'Adventure',
  WELLNESS: 'Wellness',
}

export const DZONGKHAGS: readonly string[] = [
  'Bumthang',
  'Chhukha',
  'Dagana',
  'Gasa',
  'Haa',
  'Lhuentse',
  'Mongar',
  'Paro',
  'Pemagatshel',
  'Punakha',
  'Samdrup Jongkhar',
  'Samtse',
  'Sarpang',
  'Thimphu',
  'Trashigang',
  'Trashiyangtse',
  'Trongsa',
  'Tsirang',
  'Wangdue Phodrang',
  'Zhemgang',
]

export const DURATION_OPTIONS: readonly number[] = [3, 5, 7, 10, 14, 30]

export function formatDuration(days: number): string {
  return days === 1 ? '1 day' : `${days} days`
}

export function formatPrice(amount: string, currency: string): string {
  const value = Number(amount)
  if (Number.isNaN(value)) {
    return `${currency} ${amount}`
  }
  return `${currency} ${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}
