import { z } from 'zod'

export const updateUserRoleSchema = z.object({
  role: z.enum(['TOURIST', 'GUIDE', 'AGENT', 'ADMIN']),
})

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
