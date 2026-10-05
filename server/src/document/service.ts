import { prisma } from '../lib/prisma.js'
import type { Pagination } from '../lib/pagination.js'
import { generateStorageKey, saveFile, readStoredFile } from '../lib/storage.js'
import {
  isAllowedMimeType,
  extensionForMimeType,
  detectMimeType,
  MAX_FILE_SIZE_BYTES,
} from './validation.js'
import {
  InvalidFileTypeError,
  FileTooLargeError,
  FileContentMismatchError,
  DocumentNotFoundError,
  DocumentAccessDeniedError,
} from './errors.js'
import type { DocumentType, DocumentStatus } from '../generated/prisma/enums.js'

export async function uploadDocument(params: {
  userId: string
  docType: DocumentType
  file: File
}) {
  const { userId, docType, file } = params

  if (!isAllowedMimeType(file.type)) {
    throw new InvalidFileTypeError()
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new FileTooLargeError()
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // The declared type is only a claim. Check the real bytes agree with it,
  // so a PNG relabeled as a PDF (or any disguised file) is rejected.
  const detectedType = detectMimeType(buffer)
  if (detectedType === null || detectedType !== file.type) {
    throw new FileContentMismatchError()
  }

  const extension = extensionForMimeType(detectedType)
  const storageKey = generateStorageKey(extension)

  await saveFile(storageKey, buffer)

  return prisma.document.create({
    data: {
      userId,
      docType,
      storageKey,
      originalFilename: file.name,
      mimeType: detectedType,
      fileSizeBytes: file.size,
    },
  })
}

export async function listDocumentsForUser(userId: string, pagination: Pagination) {
  const where = { userId }
  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: [{ uploadedAt: 'desc' }, { id: 'asc' }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.document.count({ where }),
  ])
  return { items, total }
}

// Owner-or-staff access: a document is readable by the traveler who
// uploaded it, or by an Agent/Admin who needs to verify it (NFR-6: access
// restricted to authorized staff). Anyone else is refused, so one tourist's
// passport scan can't be read by another via a guessed or leaked id.
export async function getDocumentFileForUser(params: {
  documentId: string
  userId: string
  role: string
}) {
  const { documentId, userId, role } = params

  const document = await prisma.document.findUnique({ where: { id: documentId } })

  if (!document) {
    throw new DocumentNotFoundError()
  }

  const isOwner = document.userId === userId
  const isStaff = role === 'AGENT' || role === 'ADMIN'
  if (!isOwner && !isStaff) {
    throw new DocumentAccessDeniedError()
  }

  const data = await readStoredFile(document.storageKey)
  return { document, data }
}

// Staff-only listing across all travelers, optionally filtered by status
// (for example, everything still PENDING). Includes who uploaded it.
export async function listAllDocuments(status: DocumentStatus | undefined, pagination: Pagination) {
  const where = status ? { status } : undefined
  const [items, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: [{ uploadedAt: 'desc' }, { id: 'asc' }],
      include: { user: { select: { id: true, email: true, fullName: true } } },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.document.count({ where }),
  ])
  return { items, total }
}

export async function reviewDocument(params: {
  documentId: string
  status: 'APPROVED' | 'REJECTED'
}) {
  const document = await prisma.document.findUnique({ where: { id: params.documentId } })
  if (!document) {
    throw new DocumentNotFoundError()
  }
  return prisma.document.update({
    where: { id: params.documentId },
    data: { status: params.status },
  })
}
