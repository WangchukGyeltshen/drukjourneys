import { prisma } from '../lib/prisma.js'
import type { Pagination } from '../lib/pagination.js'
import { sendEmail } from '../lib/email.js'
import { renderTemplate, type NotificationData } from './templates.js'

// Fire-and-log: sends the email and records the attempt, but NEVER
// throws back to the caller. By the time this is called, the actual
// operation (SDF calculated, guide assigned, payment confirmed) has
// already succeeded and been committed to the database — a flaky SMTP
// connection or a typo'd Gmail app password must not roll back or fail
// that already-successful operation. Failures are instead visible via
// the notification log (GET /notifications) for staff to catch and
// manually follow up on.
export async function sendNotification(params: {
  userId: string
  bookingId?: string
  data: NotificationData
}): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: params.userId } })
  if (!user) {
    console.error(`sendNotification: user ${params.userId} not found — skipping`)
    return
  }

  const { subject, html } = renderTemplate(params.data)

  try {
    await sendEmail({ to: user.email, subject, html })
    await prisma.notification.create({
      data: {
        userId: user.id,
        bookingId: params.bookingId,
        type: params.data.type,
        recipientAddress: user.email,
        subject,
        status: 'SENT',
      },
    })
  } catch (err) {
    console.error('Failed to send notification email:', err)
    await prisma.notification.create({
      data: {
        userId: user.id,
        bookingId: params.bookingId,
        type: params.data.type,
        recipientAddress: user.email,
        subject,
        status: 'FAILED',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      },
    })
  }
}

export async function listNotifications(pagination: Pagination) {
  const [items, total] = await Promise.all([
    prisma.notification.findMany({
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.notification.count(),
  ])
  return { items, total }
}
