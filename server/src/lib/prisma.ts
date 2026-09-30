import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not set — check your .env file')
}

// Prisma 7 requires an explicit driver adapter rather than connecting
// straight from DATABASE_URL. PrismaPg wraps the `pg` package (the actual
// Postgres client) and hands Prisma a connection through it.
const adapter = new PrismaPg({ connectionString })

// Reuse a single PrismaClient instance across the whole app, instead of
// creating a new one every time this module is imported. Each PrismaClient
// opens its own pool of database connections — creating many of them
// (which `tsx watch`'s hot-reload can easily cause during development)
// exhausts Postgres's connection limit.
export const prisma = new PrismaClient({ adapter })
