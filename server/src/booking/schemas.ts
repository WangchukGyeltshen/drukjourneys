import { z } from 'zod'

export const createBookingSchema = z.object({
  packageId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  travelerCount: z.coerce.number().int().positive(),
})

export const calculateBookingSdfSchema = z.object({
  travelerCategory: z.enum(['INTERNATIONAL', 'INDIAN', 'BANGLADESHI', 'MALDIVIAN', 'DOMESTIC']),
  age: z.coerce.number().int().min(0).max(120),
})

export const assignGuideSchema = z.object({
  guideId: z.string().uuid(),
  vehicleId: z.string().uuid(),
})

export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type CalculateBookingSdfInput = z.infer<typeof calculateBookingSdfSchema>
export type AssignGuideInput = z.infer<typeof assignGuideSchema>
