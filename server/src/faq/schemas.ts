import { z } from 'zod'

export const createFaqEntrySchema = z.object({
  category: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  order: z.coerce.number().int().optional(),
})

export const updateFaqEntrySchema = z.object({
  category: z.string().min(1).optional(),
  question: z.string().min(1).optional(),
  answer: z.string().min(1).optional(),
  order: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
})

export type CreateFaqEntryInput = z.infer<typeof createFaqEntrySchema>
export type UpdateFaqEntryInput = z.infer<typeof updateFaqEntrySchema>
