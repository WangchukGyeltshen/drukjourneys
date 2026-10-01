import { prisma } from '../lib/prisma.js'
import { generateStorageKey, saveFile, readStoredFile } from '../lib/storage.js'
import { isAllowedMimeType, extensionForMimeType, MAX_FILE_SIZE_BYTES } from './validation.js'
import { InvalidFileTypeError, FileTooLargeError, DocumentNotFoundError, DocumentAccessDeniedError } from './errors.js'
import type { DocumentType } from '../generated/prisma/enums.js'

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

  const extension = extensionForMimeType(file.type)
  const storageKey = generateStorageKey(extension)
  const buffer = Buffer.from(await file.arrayBuffer())

  await saveFile(storageKey, buffer)

  return prisma.document.create({
    data: {
      userId,
      docType,
      storageKey,
      originalFilename: file.name,
      mimeType: file.type,
      fileSizeBytes: file.size,
    },
  })
}

export async function listDocumentsForUser(userId: string) {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  })
}

// Returns the document's metadata AND its file bytes, but only after
// confirming the requesting user actually owns it — this is the
// ownership check that keeps one tourist's passport scan from being
// readable by another via a guessed or leaked document id.
export async function getOwnedDocumentFile(params: { documentId: string; userId: string }) {
  const { documentId, userId } = params

  const document = await prisma.document.findUnique({ where: { id: documentId } })

  if (!document) {
    throw new DocumentNotFoundError()
  }

  if (document.userId !== userId) {
    throw new DocumentAccessDeniedError()
  }

  const data = await readStoredFile(document.storageKey)
  return { document, data }
}
