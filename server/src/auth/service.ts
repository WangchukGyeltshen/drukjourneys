import * as argon2 from 'argon2'
import { prisma } from '../lib/prisma.js'
import type { RegisterInput, LoginInput } from './schemas.js'
import { EmailAlreadyExistsError, InvalidCredentialsError } from './errors.js'

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
