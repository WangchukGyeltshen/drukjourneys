import { cookies } from 'next/headers'

// The API's tokens live in httpOnly cookies set by the Next.js server.
// Browser JavaScript can never read them, and the browser never calls the
// API directly, so no CORS rule is needed.
const ACCESS_COOKIE = 'dj_access'
const REFRESH_COOKIE = 'dj_refresh'

// These match the API: access tokens last 2 hours, refresh tokens 7 days.
const ACCESS_MAX_AGE = 60 * 60 * 2
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}

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
