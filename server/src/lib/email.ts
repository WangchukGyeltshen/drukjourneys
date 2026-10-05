import nodemailer from 'nodemailer'

const GMAIL_USER = process.env.GMAIL_USER
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD

if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
  throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set — check your .env file')
}

// A single shared transporter, reused across every send rather than
// reconnecting per email — same reasoning as the single shared `prisma`
// client in lib/prisma.ts.
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // implicit TLS: the whole connection is encrypted from the start
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
})

export async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  await transporter.sendMail({
    from: `"DrukJourneys" <${GMAIL_USER}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  })
}
