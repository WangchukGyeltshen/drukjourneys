import { API_BASE_URL } from '@/lib/api'
import { getAccessToken } from '@/lib/session'

export type AuthUser = {
  id: string
  email: string
  fullName: string
  nationality: string | null
  role: 'TOURIST' | 'GUIDE' | 'AGENT' | 'ADMIN'
}

export type AuthResult =
  | { ok: true; user: AuthUser; token: string; refreshToken: string }
  | { ok: false; status: number; error: string; fieldErrors?: Record<string, string[]> }

// POST to an auth endpoint. Network failures become a normal result, so
// callers show a message instead of crashing the page.
export async function postAuth(path: string, body: unknown): Promise<AuthResult> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, status: 0, error: 'We could not reach the server. Please try again.' }
  }

  const data = (await response.json().catch(() => null)) as {
    user?: AuthUser
    token?: string
    refreshToken?: string
    error?: string
    details?: Record<string, string[]>
  } | null

  if (response.ok && data?.user && data.token && data.refreshToken) {
    return { ok: true, user: data.user, token: data.token, refreshToken: data.refreshToken }
  }
  return {
    ok: false,
    status: response.status,
    error: data?.error ?? 'Something went wrong. Please try again.',
    fieldErrors: data?.details,
  }
}

// Returns the signed-in user, or null when there is no valid session.
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAccessToken()
  if (!token) {
    return null
  }
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (!response.ok) {
      return null
    }
    const data = (await response.json()) as { user: AuthUser }
    return data.user
  } catch {
    return null
  }
}
