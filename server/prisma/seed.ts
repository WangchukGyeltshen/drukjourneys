import 'dotenv/config'
import { prisma } from '../src/lib/prisma.js'

// Running this script twice shouldn't create duplicate rows, so we clear
// existing packages first. Fine for a development seed script; this
// approach would NOT be appropriate for a production migration.
async function main() {
  // Delete order matters: Booking has a foreign key to Package (and
  // SdfRecord/GuideAssignment cascade-delete from Booking, but Guide and
  // Vehicle do NOT cascade-delete, so bookings must go first, then
  // packages/guides/vehicles can be safely cleared).
  await prisma.booking.deleteMany()
  await prisma.package.deleteMany()
  await prisma.guide.deleteMany()
  await prisma.vehicle.deleteMany()

  await prisma.package.createMany({
    data: [
      {
        title: 'Paro & Thimphu Cultural Explorer',
        description:
          'A classic introduction to Bhutan: Tiger\'s Nest Monastery, Thimphu\'s dzongs, and local markets.',
        dzongkhag: 'Paro',
        category: 'CULTURAL',
        durationDays: 5,
        basePrice: 1450.0,
        currency: 'USD',
        requiresSpecialPermit: false,
      },
      {
        title: 'Druk Path Trek',
        description:
          'A moderate 6-day trek between Paro and Thimphu, passing high-altitude lakes and yak herder camps.',
        dzongkhag: 'Paro',
        category: 'TREKKING',
        durationDays: 6,
        basePrice: 1800.0,
        currency: 'USD',
        requiresSpecialPermit: false,
      },
      {
        title: 'Thimphu Tshechu Festival Tour',
        description:
          'Timed to the annual Thimphu Tshechu mask-dance festival, with cultural sightseeing around the capital.',
        dzongkhag: 'Thimphu',
        category: 'FESTIVAL',
        durationDays: 4,
        basePrice: 1200.0,
        currency: 'USD',
        requiresSpecialPermit: false,
      },
      {
        title: 'Snowman Trek',
        description:
          "One of the world's most difficult treks, crossing remote high-altitude passes in northern Bhutan.",
        dzongkhag: 'Gasa',
        category: 'TREKKING',
        durationDays: 25,
        basePrice: 9500.0,
        currency: 'USD',
        requiresSpecialPermit: true,
      },
    ],
  })

  await prisma.guide.createMany({
    data: [
      { name: 'Sonam Dorji', licenseNumber: 'TCB-GUIDE-0001' },
      { name: 'Tshering Pem', licenseNumber: 'TCB-GUIDE-0002' },
    ],
  })

  await prisma.vehicle.createMany({
    data: [
      { plateNumber: 'BP-1-A1234', type: 'SUV' },
      { plateNumber: 'BP-1-B5678', type: 'Minibus' },
    ],
  })

  console.log('Seeded 4 packages, 2 guides, 2 vehicles.')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
