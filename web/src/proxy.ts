import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { buildForwardedHeaders } from '@/lib/forwarded'
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  cookieOptions,
} from '@/lib/session-config'

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000'

// The access cookie expires after 2 hours and disappears. If the visitor
// still has a refresh cookie, trade it for a new pair here, before the page
// renders. Server Components cannot set cookies, so this is the place to do
// it. Any failure just lets the request through: the visitor then looks
// signed out and can sign in again, and the refresh cookie is left alone so
// a parallel request that already refreshed is not undone.
export async function proxy(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  if (!refreshToken) {
    return NextResponse.next()
  }

  let data: { token?: string; refreshToken?: string } | null = null
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...buildForwardedHeaders(request.headers) },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    })
    if (!response.ok) {
      return NextResponse.next()
    }
    data = await response.json()
  } catch {
    return NextResponse.next()
  }
  if (!data?.token || !data.refreshToken) {
    return NextResponse.next()
  }

  // Make the new tokens visible to this same request's render, and send
  // them to the browser for the next ones.
  request.cookies.set(ACCESS_COOKIE, data.token)
  request.cookies.set(REFRESH_COOKIE, data.refreshToken)
  const next = NextResponse.next({ request })
  next.cookies.set(ACCESS_COOKIE, data.token, cookieOptions(ACCESS_MAX_AGE))
  next.cookies.set(REFRESH_COOKIE, data.refreshToken, cookieOptions(REFRESH_MAX_AGE))
  return next
}

// Runs only for page requests that have a refresh cookie but no access
// cookie. The cookie names must be written out here (matcher values have to
// be constants); they match lib/session-config.ts.
export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|packages/.*\\.jpg$).*)',
      has: [{ type: 'cookie', key: 'dj_refresh' }],
      missing: [{ type: 'cookie', key: 'dj_access' }],
    },
  ],
}
