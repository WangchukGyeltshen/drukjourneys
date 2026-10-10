import { cookies } from 'next/headers'
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  cookieOptions,
} from '@/lib/session-config'

// The API's tokens live in httpOnly cookies set by the Next.js server.
// Browser JavaScript can never read them, and the browser never calls the
// API directly, so no CORS rule is needed.

export async function setSession(accessToken: string, refreshToken: string) {
  const store = await cookies()
  store.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE))
  store.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE))
}

export async function clearSession() {
  const store = await cookies()
  store.delete(ACCESS_COOKIE)
  store.delete(REFRESH_COOKIE)
}

export async function getAccessToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(ACCESS_COOKIE)?.value ?? null
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies()
  return store.get(REFRESH_COOKIE)?.value ?? null
}
