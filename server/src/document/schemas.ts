import { z } from 'zod'

export const docTypeSchema = z.enum(['PASSPORT', 'VISA', 'PERMIT', 'PHOTO', 'OTHER'])
