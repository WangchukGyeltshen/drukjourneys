import { prisma } from '../lib/prisma.js'
import type { Pagination } from '../lib/pagination.js'
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

export async function listUsers(pagination: Pagination) {
  const [items, total] = await Promise.all([
    prisma.user.findMany({
      select: SAFE_USER_FIELDS,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], // id breaks ties so pages never overlap
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.user.count(),
  ])
  return { items, total }
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
