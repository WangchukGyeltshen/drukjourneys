import { z } from 'zod'

export const createReviewSchema = z.object({
  packageRating: z.coerce.number().int().min(1).max(5),
  packageComment: z.string().max(2000).optional(),
  guideRating: z.coerce.number().int().min(1).max(5).optional(),
  guideComment: z.string().max(2000).optional(),
})

// Same shape as create — a review is fully replaceable via PATCH rather
// than supporting partial field-by-field edits, since a review is a
// small, cohesive piece of feedback rather than a record with many
// independent fields.
export const updateReviewSchema = createReviewSchema

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
