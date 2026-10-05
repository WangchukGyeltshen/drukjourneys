import { z } from 'zod'

export const docTypeSchema = z.enum(['PASSPORT', 'VISA', 'PERMIT', 'PHOTO', 'OTHER'])

export const documentStatusFilterSchema = z.enum(['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'])

// Staff can only move a document to a final decision, not back to PENDING.
export const reviewDocumentSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
})
