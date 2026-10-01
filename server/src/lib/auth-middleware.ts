import type { Context, Next } from 'hono'
import { verifyAccessToken, type TokenPayload } from './jwt.js'

// Makes `c.get('user')` and `c.set('user', ...)` type-safe elsewhere in
// the app, instead of `user` being `any`.
export type AuthVariables = {
  user: TokenPayload
}

export async function requireAuth(c: Context<{ Variables: AuthVariables }>, next: Next) {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or malformed Authorization header' }, 401)
  }

  const token = authHeader.slice('Bearer '.length)

  try {
    const payload = await verifyAccessToken(token)
    c.set('user', payload)
  } catch (err) {
    // Log the real reason server-side (tampered token, expired, wrong
    // algorithm, etc.) but never leak it to the client — same pattern as
    // the global onError handler in index.ts.
    console.error('requireAuth verification failed:', err)
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  await next()
}

// A middleware *factory*: call it with the roles allowed to proceed, and
// it returns a middleware configured for that check. Must run AFTER
// requireAuth, since it depends on c.get('user') already being set.
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const user = c.get('user')
    if (!allowedRoles.includes(user.role)) {
      return c.json({ error: 'You do not have permission to perform this action' }, 403)
    }
    await next()
  }
}
