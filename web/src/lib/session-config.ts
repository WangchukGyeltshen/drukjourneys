// Shared by the cookie helpers (lib/session.ts) and the refresh proxy
// (proxy.ts), so both agree on names and lifetimes.
export const ACCESS_COOKIE = 'dj_access'
export const REFRESH_COOKIE = 'dj_refresh'

// These match the API: access tokens last 2 hours, refresh tokens 7 days.
export const ACCESS_MAX_AGE = 60 * 60 * 2
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  }
}
