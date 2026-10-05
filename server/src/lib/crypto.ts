import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const RAW_KEY = process.env.DOCUMENT_ENCRYPTION_KEY

if (!RAW_KEY) {
  throw new Error('DOCUMENT_ENCRYPTION_KEY must be set, check your .env file')
}

const KEY = Buffer.from(RAW_KEY, 'base64')

if (KEY.length !== 32) {
  throw new Error('DOCUMENT_ENCRYPTION_KEY must be exactly 32 bytes, base64-encoded')
}

const IV_LENGTH = 12 // standard nonce size for GCM
const TAG_LENGTH = 16 // GCM authentication tag size

// AES-256-GCM. A fresh random IV is generated per file (reusing an IV with
// the same key breaks GCM's security). Stored layout: IV | tag | ciphertext.
export function encryptBuffer(plain: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', KEY, iv)
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, ciphertext])
}

// Throws if the file was modified or the key is wrong: GCM checks the tag.
export function decryptBuffer(stored: Buffer): Buffer {
  if (stored.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('Stored file is too short to be a valid encrypted file')
  }
  const iv = stored.subarray(0, IV_LENGTH)
  const tag = stored.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const ciphertext = stored.subarray(IV_LENGTH + TAG_LENGTH)
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}
