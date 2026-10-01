import { z } from 'zod'

// Query params arrive as strings (?durationDays=5), so we coerce them to
// the right type before validating, rather than parsing manually in the
// route handler.
export const listPackagesQuerySchema = z.object({
  dzongkhag: z.string().trim().min(1).optional(),
  category: z
    .enum(['CULTURAL', 'TREKKING', 'FESTIVAL', 'PILGRIMAGE', 'ADVENTURE', 'WELLNESS'])
    .optional(),
  maxDurationDays: z.coerce.number().int().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
})

export type ListPackagesQuery = z.infer<typeof listPackagesQuerySchema>
