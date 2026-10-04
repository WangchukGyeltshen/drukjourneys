import { z } from 'zod'

export const createSupportInquirySchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
})

export const updateSupportInquiryStatusSchema = z.object({
  status: z.enum(['OPEN', 'RESOLVED']),
})

export type CreateSupportInquiryInput = z.infer<typeof createSupportInquirySchema>
export type UpdateSupportInquiryStatusInput = z.infer<typeof updateSupportInquiryStatusSchema>
