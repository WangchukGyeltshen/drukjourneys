import { z } from 'zod'

export const calculateSdfSchema = z.object({
  travelerCategory: z.enum(['INTERNATIONAL', 'INDIAN', 'BANGLADESHI', 'MALDIVIAN', 'DOMESTIC']),
  nights: z.coerce.number().int().positive(),
  age: z.coerce.number().int().min(0).max(120),
})

export type CalculateSdfInput = z.infer<typeof calculateSdfSchema>
