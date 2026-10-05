// Server-side file validation. The client's reported MIME type and
// filename extension are both easily spoofed, so this is a defense
// against careless mistakes, not a guarantee — but it stops the easy
// cases (an .exe renamed to .pdf won't pass the MIME check from a real
// browser upload, and rejecting unknown types outright limits the
// attack surface regardless).

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export function isAllowedMimeType(mimeType: string): boolean {
  return mimeType in ALLOWED_MIME_TYPES
}

export function extensionForMimeType(mimeType: string): string {
  return ALLOWED_MIME_TYPES[mimeType] ?? ''
}

// Reads the file's leading bytes (its "magic numbers") to find the real
// type. Unlike file.type, which the client chooses, this can't be changed
// just by relabeling an upload (NFR-6: only genuine PDF/JPG/PNG files are
// allowed into the document store).
export function detectMimeType(data: Buffer): string | null {
  if (data.length >= 4 && data.subarray(0, 4).toString('latin1') === '%PDF') {
    return 'application/pdf'
  }
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (data.length >= 8 && data.subarray(0, 8).equals(pngSignature)) {
    return 'image/png'
  }
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return 'image/jpeg'
  }
  return null
}
