import type { Booking } from '@/lib/bookings-api'
import { REQUIRED_DOCUMENT_TYPES, type DocumentStatus, type DocumentType } from '@/lib/document-rules'

export type StepKey = 'fee' | 'documents' | 'guide' | 'payment'
export type StepState = 'done' | 'current' | 'upcoming'
export type FlowStep = { key: StepKey; label: string; state: StepState; href: string | null }

type DocumentSummary = { docType: DocumentType; status: DocumentStatus }

// All three required documents are on file and the newest of each is not rejected.
// The list is newest first, so the first match is the latest upload.
export function documentsComplete(documents: DocumentSummary[]): boolean {
  return REQUIRED_DOCUMENT_TYPES.every((docType) => {
    const latest = documents.find((document) => document.docType === docType)
    return Boolean(latest) && latest?.status !== 'REJECTED'
  })
}

export function bookingTotals(booking: Booking) {
  const packageTotal = Math.round(Number(booking.package.basePrice) * booking.travelerCount * 100) / 100
  const sdf = booking.sdfRecord
  const sameCurrency = Boolean(sdf) && sdf?.currency === booking.package.currency
  return {
    packageTotal,
    sdfTotal: sdf ? Number(sdf.totalSdf) : null,
    total: sdf && sameCurrency ? packageTotal + Number(sdf.totalSdf) : null,
    currency: booking.package.currency,
  }
}

export function flowSteps(booking: Booking, documentsOk: boolean): FlowStep[] {
  const base = `/bookings/${booking.id}`
  const done: Record<StepKey, boolean> = {
    fee: booking.sdfRecord !== null,
    documents: documentsOk,
    guide: booking.status === 'GUIDE_ASSIGNED' || booking.status === 'CONFIRMED',
    payment: booking.status === 'CONFIRMED',
  }
  const order: { key: StepKey; label: string; href: string | null }[] = [
    { key: 'fee', label: 'Fee', href: `${base}/fee` },
    { key: 'documents', label: 'Documents', href: `${base}/documents` },
    { key: 'guide', label: 'Guide', href: null },
    { key: 'payment', label: 'Payment', href: `${base}/payment` },
  ]
  const cancelled = booking.status === 'CANCELLED'
  let currentFound = false
  return order.map((step) => {
    if (done[step.key]) {
      return { ...step, state: 'done' as const }
    }
    if (!currentFound && !cancelled) {
      currentFound = true
      return { ...step, state: 'current' as const }
    }
    return { ...step, state: 'upcoming' as const }
  })
}

// Short "what happens next" line for the My bookings list.
export const BOOKING_NEXT_HINT: Record<Booking['status'], string> = {
  DRAFT: 'Next: calculate your fee',
  SDF_CALCULATED: 'Next: upload your documents',
  GUIDE_ASSIGNED: 'Ready to pay',
  CONFIRMED: 'Confirmed and paid',
  CANCELLED: 'Cancelled',
}

export function canCancel(status: Booking['status']): boolean {
  return status === 'DRAFT' || status === 'SDF_CALCULATED' || status === 'GUIDE_ASSIGNED'
}
