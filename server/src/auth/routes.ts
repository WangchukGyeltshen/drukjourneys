import { Hono } from 'hono'
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from './schemas.js'
import {
  registerUser,
  authenticateUser,
  getUserById,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from './service.js'
import { signAccessToken } from '../lib/jwt.js'
import {
  EmailAlreadyExistsError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from './errors.js'
import { requireAuth, type AuthVariables } from '../lib/auth-middleware.js'

export const authRoutes = new Hono<{ Variables: AuthVariables }>()

async function parseJsonBody(c: { req: { json: () => Promise<unknown> } }) {
  try {
    return { ok: true as const, data: await c.req.json() }
  } catch {
    return { ok: false as const }
  }
}

authRoutes.post('/register', async (c) => {
  const parsed = await parseJsonBody(c)
  if (!parsed.ok) {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = registerSchema.safeParse(parsed.data)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const user = await registerUser(result.data)
    const token = await signAccessToken(user.id, user.role)
    const refreshToken = await issueRefreshToken(user.id)
    return c.json({ user, token, refreshToken }, 201)
  } catch (err) {
    if (err instanceof EmailAlreadyExistsError) {
      return c.json({ error: err.message }, 409)
    }
    throw err
  }
})

authRoutes.post('/login', async (c) => {
  const parsed = await parseJsonBody(c)
  if (!parsed.ok) {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = loginSchema.safeParse(parsed.data)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const user = await authenticateUser(result.data)
    const token = await signAccessToken(user.id, user.role)
    const refreshToken = await issueRefreshToken(user.id)
    return c.json({ user, token, refreshToken }, 200)
  } catch (err) {
    if (err instanceof InvalidCredentialsError) {
      return c.json({ error: err.message }, 401)
    }
    throw err
  }
})

authRoutes.post('/refresh', async (c) => {
  const parsed = await parseJsonBody(c)
  if (!parsed.ok) {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = refreshSchema.safeParse(parsed.data)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  try {
    const { newRawToken, user } = await rotateRefreshToken(result.data.refreshToken)
    const token = await signAccessToken(user.id, user.role)
    return c.json({ user, token, refreshToken: newRawToken }, 200)
  } catch (err) {
    if (err instanceof InvalidRefreshTokenError) {
      return c.json({ error: err.message }, 401)
    }
    throw err
  }
})

authRoutes.post('/logout', async (c) => {
  const parsed = await parseJsonBody(c)
  if (!parsed.ok) {
    return c.json({ error: 'Request body must be valid JSON' }, 400)
  }

  const result = logoutSchema.safeParse(parsed.data)
  if (!result.success) {
    return c.json(
      { error: 'Validation failed', details: result.error.flatten().fieldErrors },
      400
    )
  }

  // Always succeeds from the client's perspective, whether or not the
  // token was still valid — we don't want this endpoint to leak whether
  // a given refresh token existed/was already revoked.
  await revokeRefreshToken(result.data.refreshToken)
  return c.json({ message: 'Logged out' }, 200)
})

// Protected: requires a valid JWT. requireAuth runs first — if the token
// is missing/invalid, this handler never executes at all.
authRoutes.get('/me', requireAuth, async (c) => {
  const tokenPayload = c.get('user')
  const user = await getUserById(tokenPayload.sub)

  if (!user) {
    // The token is valid, but the user it refers to no longer exists
    // (e.g. deleted after the token was issued).
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json({ user })
})
