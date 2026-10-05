import { randomUUID } from 'node:crypto'
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { encryptBuffer, decryptBuffer } from './crypto.js'

// Local-disk implementation of document storage, for development only.
// Deliberately isolated behind these three functions so that swapping
// in real object storage (S3-compatible, per SDD.md) later only means
// rewriting this one file — nothing in document/service.ts should need
// to change.

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')

async function ensureUploadsDir(): Promise<void> {
  await mkdir(UPLOADS_DIR, { recursive: true })
}

// Generates a random, unguessable storage key — NEVER derived from the
// user-supplied filename. Using the original filename directly would
// allow path traversal (e.g. "../../etc/passwd") and leaks information
// about the uploader's local filesystem.
export function generateStorageKey(extension: string): string {
  return `${randomUUID()}${extension}`
}

export async function saveFile(storageKey: string, data: Buffer): Promise<void> {
  await ensureUploadsDir()
  const filePath = path.join(UPLOADS_DIR, storageKey)
  // Encrypted before it touches disk (NFR-6): only ciphertext is ever stored.
  await writeFile(filePath, encryptBuffer(data))
}

export async function readStoredFile(storageKey: string): Promise<Buffer> {
  const filePath = path.join(UPLOADS_DIR, storageKey)
  return decryptBuffer(await readFile(filePath))
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
  const filePath = path.join(UPLOADS_DIR, storageKey)
  await unlink(filePath)
}
