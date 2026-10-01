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
