// Plain constants with no server imports, so client components can use them.
export type DocumentType = 'PASSPORT' | 'VISA' | 'PERMIT' | 'PHOTO' | 'OTHER'
export type DocumentStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

// The documents every traveller must provide before paying.
export const REQUIRED_DOCUMENT_TYPES = ['PASSPORT', 'VISA', 'PHOTO'] as const
export type RequiredDocumentType = (typeof REQUIRED_DOCUMENT_TYPES)[number]

export const DOCUMENT_TYPE_LABELS: Record<RequiredDocumentType, string> = {
  PASSPORT: 'Passport',
  VISA: 'Visa',
  PHOTO: 'Passport-style photo',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING: 'Uploaded, waiting for review',
  SUBMITTED: 'Uploaded, waiting for review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected. Please upload a new file.',
}

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
