import { API_BASE_URL } from '@/lib/api'
import { getAccessToken } from '@/lib/session'
import type { DocumentStatus, DocumentType } from '@/lib/document-rules'

export type TravelDocument = {
  id: string
  docType: DocumentType
  status: DocumentStatus
  originalFilename: string
  uploadedAt: string
}

export type UploadDocumentResult = { ok: true } | { ok: false; status: number; error: string }

// The signed-in traveller's own documents, newest first. Returns an empty
// list when there is no valid session (the booking page redirects first).
export async function listMyDocuments(): Promise<TravelDocument[]> {
  const token = await getAccessToken()
  if (!token) {
    return []
  }
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/documents?pageSize=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
  } catch {
    throw new Error('Could not reach the document service')
  }
  if (response.status === 401) {
    return []
  }
  if (!response.ok) {
    throw new Error(`Document request failed with status ${response.status}`)
  }
  const data = (await response.json()) as { documents: TravelDocument[] }
  return data.documents
}

export async function uploadDocument(docType: DocumentType, file: File): Promise<UploadDocumentResult> {
  const token = await getAccessToken()
  if (!token) {
    return { ok: false, status: 401, error: 'Please sign in again.' }
  }
  const body = new FormData()
  body.append('docType', docType)
  body.append('file', file, file.name)
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
      cache: 'no-store',
    })
  } catch {
    return { ok: false, status: 0, error: 'We could not reach the server. Please try again.' }
  }
  if (response.ok) {
    return { ok: true }
  }
  const data = (await response.json().catch(() => null)) as { error?: string } | null
  return { ok: false, status: response.status, error: data?.error ?? 'Something went wrong. Please try again.' }
}
