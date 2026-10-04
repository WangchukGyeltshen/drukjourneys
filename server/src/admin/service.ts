import { prisma } from '../lib/prisma.js'
import { UserNotFoundError, CannotModifyOwnRoleError } from './errors.js'
import type { UpdateUserRoleInput } from './schemas.js'

// Deliberately excludes passwordHash from every result below — even
// though it's a hash and not a plaintext password, there's no reason
// for it to ever leave the database, and omitting it here means no
// future route built on top of this function can accidentally leak it.
const SAFE_USER_FIELDS = {
  id: true,
  email: true,
  fullName: true,
  nationality: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function listUsers() {
  return prisma.user.findMany({
    select: SAFE_USER_FIELDS,
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateUserRole(params: {
  targetUserId: string
  actingUserId: string
  input: UpdateUserRoleInput
}) {
  if (params.targetUserId === params.actingUserId) {
    throw new CannotModifyOwnRoleError()
  }

  const existing = await prisma.user.findUnique({ where: { id: params.targetUserId } })
  if (!existing) {
    throw new UserNotFoundError()
  }

  return prisma.user.update({
    where: { id: params.targetUserId },
    data: { role: params.input.role },
    select: SAFE_USER_FIELDS,
  })
}
