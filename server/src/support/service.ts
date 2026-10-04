import { prisma } from '../lib/prisma.js'
import { SupportInquiryNotFoundError } from './errors.js'
import type { CreateSupportInquiryInput, UpdateSupportInquiryStatusInput } from './schemas.js'

// Deliberately anonymous/unauthenticated — this is a pre-booking
// contact-form path (PRD: "real-time channel for pre-booking
// questions"), and a visitor asking a question before deciding whether
// to even register shouldn't need an account first.
export async function createSupportInquiry(input: CreateSupportInquiryInput) {
  return prisma.supportInquiry.create({ data: input })
}

export async function listSupportInquiries() {
  return prisma.supportInquiry.findMany({ orderBy: { createdAt: 'desc' } })
}

export async function updateSupportInquiryStatus(id: string, input: UpdateSupportInquiryStatusInput) {
  const existing = await prisma.supportInquiry.findUnique({ where: { id } })
  if (!existing) {
    throw new SupportInquiryNotFoundError()
  }
  return prisma.supportInquiry.update({ where: { id }, data: input })
}
