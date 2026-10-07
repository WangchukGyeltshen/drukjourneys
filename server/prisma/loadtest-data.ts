import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'

// Adds (or removes) a large batch of fake packages so load tests run
// against a realistic catalog instead of 4 rows. Every row is titled
// "LOADTEST <n>", and the clean command deletes ONLY rows with that
// prefix, so it can never touch real data. Unlike prisma/seed.ts, this
// script never deletes bookings.
//
//   npx tsx prisma/loadtest-data.ts seed    add 2000 packages
//   npx tsx prisma/loadtest-data.ts clean   remove them again

const PREFIX = 'LOADTEST '
const COUNT = 2000

const DZONGKHAGS = ['Paro', 'Thimphu', 'Punakha', 'Bumthang', 'Haa', 'Wangdue Phodrang', 'Trongsa', 'Gasa']
const CATEGORIES = ['CULTURAL', 'TREKKING', 'FESTIVAL', 'PILGRIMAGE', 'ADVENTURE', 'WELLNESS'] as const

async function main() {
  const command = process.argv[2]

  if (command === 'seed') {
    const existing = await prisma.package.count({ where: { title: { startsWith: PREFIX } } })
    if (existing > 0) {
      console.log(`${existing} load-test packages already exist; run "clean" first.`)
      return
    }
    await prisma.package.createMany({
      data: Array.from({ length: COUNT }, (_, i) => ({
        title: `${PREFIX}${i + 1}`,
        description: 'Generated package used only for load testing. '.repeat(4),
        dzongkhag: DZONGKHAGS[i % DZONGKHAGS.length]!,
        category: CATEGORIES[i % CATEGORIES.length]!,
        durationDays: 2 + (i % 13),
        basePrice: 300 + (i % 38) * 100,
        currency: 'USD',
        requiresSpecialPermit: i % 7 === 0,
      })),
    })
    console.log(`Added ${COUNT} load-test packages.`)
  } else if (command === 'clean') {
    const result = await prisma.package.deleteMany({ where: { title: { startsWith: PREFIX } } })
    console.log(`Removed ${result.count} load-test packages.`)
  } else {
    console.log('Usage: npx tsx prisma/loadtest-data.ts seed|clean')
  }
}

try {
  await main()
} catch (err) {
  console.error(err)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
