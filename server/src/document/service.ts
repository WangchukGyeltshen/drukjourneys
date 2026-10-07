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

type StaffRole = 'AGENT' | 'ADMIN'

function asStaffRole(role: string): StaffRole | null {
  return role === 'AGENT' || role === 'ADMIN' ? role : null
}
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
  const staffRole = asStaffRole(role)
  if (!isOwner && !staffRole) {
    throw new DocumentAccessDeniedError()
  }

  const data = await readStoredFile(document.storageKey)

  // Staff access to someone else's document is audited (NFR-6). The log
  // write is awaited and NOT caught on purpose: if the audit entry can't
  // be recorded, the file is not handed over (fail closed).
  if (!isOwner && staffRole) {
    await prisma.documentAccessLog.create({
      data: {
        documentId: document.id,
        ownerId: document.userId,
        actorId: userId,
        actorRole: staffRole,
        action: 'DOWNLOAD',
      },
    })
  }

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

// Admin-only view of the staff access audit trail, newest first,
// optionally narrowed to a single document.
export async function listAccessLogs(documentId: string | undefined, pagination: Pagination) {
  const where = documentId ? { documentId } : undefined
  const [items, total] = await Promise.all([
    prisma.documentAccessLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.documentAccessLog.count({ where }),
  ])
  return { items, total }
}

export async function reviewDocument(params: {
  documentId: string
  status: 'APPROVED' | 'REJECTED'
  actorId: string
  actorRole: string
}) {
  const staffRole = asStaffRole(params.actorRole)
  if (!staffRole) {
    throw new DocumentAccessDeniedError()
  }

  const document = await prisma.document.findUnique({ where: { id: params.documentId } })
  if (!document) {
    throw new DocumentNotFoundError()
  }

  // Status change and its audit entry succeed or fail together.
  const [updated] = await prisma.$transaction([
    prisma.document.update({
      where: { id: params.documentId },
      data: { status: params.status },
    }),
    prisma.documentAccessLog.create({
      data: {
        documentId: document.id,
        ownerId: document.userId,
        actorId: params.actorId,
        actorRole: staffRole,
        action: 'STATUS_CHANGE',
        newStatus: params.status,
      },
    }),
  ])
  return updated
}
