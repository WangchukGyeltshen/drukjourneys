import { z } from 'zod'

export const createGuideSchema = z.object({
  name: z.string().min(1),
  licenseNumber: z.string().min(1),
})

export const updateGuideSchema = z.object({
  name: z.string().min(1).optional(),
  licenseNumber: z.string().min(1).optional(),
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'INACTIVE']).optional(),
})

export const createVehicleSchema = z.object({
  plateNumber: z.string().min(1),
  type: z.string().min(1),
})

export const updateVehicleSchema = z.object({
  plateNumber: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'INACTIVE']).optional(),
})

export type CreateGuideInput = z.infer<typeof createGuideSchema>
export type UpdateGuideInput = z.infer<typeof updateGuideSchema>
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
