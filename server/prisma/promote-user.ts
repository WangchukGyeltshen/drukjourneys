import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'

// Dev helper: sets the role of an existing user, found by email.
// There is no API path to create the first staff account, so tests
// that need an AGENT or ADMIN use this.
//
//   npx tsx prisma/promote-user.ts <email> <TOURIST|GUIDE|AGENT|ADMIN>

const ROLES = ['TOURIST', 'GUIDE', 'AGENT', 'ADMIN'] as const
type RoleName = (typeof ROLES)[number]

async function main() {
  const email = process.argv[2]?.trim().toLowerCase()
  const role = process.argv[3] as RoleName | undefined

  if (!email || !role || !ROLES.includes(role)) {
    console.error('Usage: npx tsx prisma/promote-user.ts <email> <TOURIST|GUIDE|AGENT|ADMIN>')
    process.exitCode = 1
    return
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.error(`No user found with email ${email}`)
    process.exitCode = 1
    return
  }

  await prisma.user.update({ where: { id: user.id }, data: { role } })
  console.log(`${email} is now ${role}`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
