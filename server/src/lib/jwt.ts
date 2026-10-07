import { sign, verify } from 'hono/jwt'

const rawSecret = process.env.JWT_SECRET

if (!rawSecret) {
  throw new Error('JWT_SECRET is not set — check your .env file')
}

// Re-bound with an explicit string type: TypeScript does not carry the
// check above into the function declarations below.
const JWT_SECRET: string = rawSecret

// What we store inside every token. Keeping this small and specific:
// enough to authorize a request without hitting the database every time,
// but nothing sensitive (never email, name, or nationality in here — a
// JWT's payload is readable by anyone who has the token, it is only
// tamper-proof, not secret).
export type TokenPayload = {
  sub: string // the user's id ("subject" — standard JWT claim name)
  role: string
  exp: number // expiry, as a Unix timestamp in seconds (standard JWT claim)
}

const TOKEN_LIFETIME_SECONDS = 60 * 60 * 2 // 2 hours

export function signAccessToken(userId: string, role: string): Promise<string> {
  const payload: TokenPayload = {
    sub: userId,
    role,
    exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS,
  }
  // hono/jwt signs with HS256 by default when no algorithm is passed.
  return sign(payload, JWT_SECRET, 'HS256')
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  // Unlike sign(), verify() does NOT default the algorithm — it must be
  // passed explicitly, or it throws "JwtAlgorithmRequired" even for a
  // perfectly valid token.
  const payload = await verify(token, JWT_SECRET, 'HS256')
  return payload as unknown as TokenPayload
}
