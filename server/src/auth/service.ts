import * as argon2 from 'argon2'
import { prisma } from '../lib/prisma.js'
import type { RegisterInput, LoginInput } from './schemas.js'
import { EmailAlreadyExistsError, InvalidCredentialsError, InvalidRefreshTokenError } from './errors.js'
import {
  generateRawRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
} from '../lib/refresh-token.js'

// Fields safe to send back to a client — never includes passwordHash.
export type SafeUser = {
  id: string
  email: string
  fullName: string
  nationality: string | null
  role: string
  createdAt: Date
}

function toSafeUser(user: {
  id: string
  email: string
  fullName: string
  nationality: string | null
  role: string
  createdAt: Date
}): SafeUser {
  const { id, email, fullName, nationality, role, createdAt } = user
  return { id, email, fullName, nationality, role, createdAt }
}

export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new EmailAlreadyExistsError()
  }

  const passwordHash = await argon2.hash(input.password)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      nationality: input.nationality,
    },
  })

  return toSafeUser(user)
}

export async function authenticateUser(input: LoginInput): Promise<SafeUser> {
  const user = await prisma.user.findUnique({ where: { email: input.email } })

  // Deliberately generic: whether the email doesn't exist, or the password
  // is wrong, we throw the exact same error. If these were distinguished
  // ("no account with that email" vs "wrong password"), an attacker could
  // use the login endpoint to discover which emails have accounts on the
  // system at all — a real privacy leak, especially for something like a
  // traveler database.
  if (!user) {
    throw new InvalidCredentialsError()
  }

  const isValid = await argon2.verify(user.passwordHash, input.password)
  if (!isValid) {
    throw new InvalidCredentialsError()
  }

  return toSafeUser(user)
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({ where: { id } })
  return user ? toSafeUser(user) : null
}

// Creates a new refresh token row for a user and returns the RAW token
// (the only time the raw value exists outside the client's hands — only
// its hash is ever stored).
export async function issueRefreshToken(userId: string): Promise<string> {
  const rawToken = generateRawRefreshToken()

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(rawToken),
      expiresAt: refreshTokenExpiry(),
    },
  })

  return rawToken
}

// Validates an incoming refresh token, revokes it, and issues a
// replacement (rotation). Returns the new raw refresh token plus the
// user info needed to sign a new access token.
export async function rotateRefreshToken(
  rawToken: string
): Promise<{ newRawToken: string; user: SafeUser }> {
  const tokenHash = hashRefreshToken(rawToken)

  const existing = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  const isInvalid =
    existing?.revokedAt !== null || existing.expiresAt.getTime() < Date.now()

  if (isInvalid) {
    throw new InvalidRefreshTokenError()
  }

  // Revoke the one that was just used...
  await prisma.refreshToken.update({
    where: { id: existing!.id },
    data: { revokedAt: new Date() },
  })

  // ...and issue a fresh one in its place.
  const newRawToken = await issueRefreshToken(existing!.userId)

  return { newRawToken, user: toSafeUser(existing!.user) }
}

// Used for logout: revokes a refresh token so it can no longer be used,
// without waiting for it to expire naturally.
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawToken)

  // updateMany (not update) because we don't want this to throw if the
  // token doesn't exist — logging out with an already-invalid token
  // should still succeed quietly from the client's point of view.
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}
