import { prisma } from '../lib/prisma.js'
import { FaqEntryNotFoundError } from './errors.js'
import type { CreateFaqEntryInput, UpdateFaqEntryInput } from './schemas.js'

// Public: only active entries, grouped for easy rendering by category.
export async function listPublicFaqEntries() {
  const entries = await prisma.faqEntry.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  })
  return entries
}

// Staff: everything, including inactive entries, so they can be
// reactivated rather than only ever created fresh.
export async function listAllFaqEntries() {
  return prisma.faqEntry.findMany({
    orderBy: [{ category: 'asc' }, { order: 'asc' }],
  })
}

export async function createFaqEntry(input: CreateFaqEntryInput) {
  return prisma.faqEntry.create({ data: input })
}

export async function updateFaqEntry(id: string, input: UpdateFaqEntryInput) {
  const existing = await prisma.faqEntry.findUnique({ where: { id } })
  if (!existing) {
    throw new FaqEntryNotFoundError()
  }
  return prisma.faqEntry.update({ where: { id }, data: input })
}
