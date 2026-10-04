function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// A discriminated union keeps each notification's required data
// type-checked at the call site — e.g. forgetting `totalSdf` when
// sending an SDF_CALCULATED notification is a compile error, not a
// runtime `undefined` in someone's inbox.
export type NotificationData =
  | { type: 'SDF_CALCULATED'; packageTitle: string; nights: number; totalSdf: number; currency: string }
  | { type: 'GUIDE_ASSIGNED'; packageTitle: string; guideName: string; vehiclePlate: string }
  | {
      type: 'BOOKING_CONFIRMED'
      packageTitle: string
      startDate: Date
      endDate: Date
      totalPaid: number
      currency: string
    }
  | { type: 'BOOKING_CANCELLED'; packageTitle: string; startDate: Date; endDate: Date }

const FOOTER = '<p style="color:#666;font-size:13px;">— DrukJourneys</p>'

export function renderTemplate(data: NotificationData): { subject: string; html: string } {
  switch (data.type) {
    case 'SDF_CALCULATED':
      return {
        subject: `Your SDF has been calculated — ${data.packageTitle}`,
        html: `<p>Hi,</p><p>The Sustainable Development Fee for your upcoming trip (<strong>${data.packageTitle}</strong>, ${data.nights} night(s)) has been calculated: <strong>${data.currency} ${data.totalSdf.toFixed(2)}</strong>.</p>${FOOTER}`,
      }
    case 'GUIDE_ASSIGNED':
      return {
        subject: `A guide has been assigned to your trip — ${data.packageTitle}`,
        html: `<p>Hi,</p><p>Your guide <strong>${data.guideName}</strong> and vehicle (${data.vehiclePlate}) have been assigned to your upcoming trip: <strong>${data.packageTitle}</strong>.</p>${FOOTER}`,
      }
    case 'BOOKING_CONFIRMED':
      return {
        subject: `Booking confirmed — ${data.packageTitle}`,
        html: `<p>Hi,</p><p>Your booking for <strong>${data.packageTitle}</strong> (${formatDate(data.startDate)} – ${formatDate(data.endDate)}) is confirmed. Total paid: <strong>${data.currency} ${data.totalPaid.toFixed(2)}</strong>.</p><p>Tashi Delek, and we look forward to welcoming you to Bhutan!</p>${FOOTER}`,
      }
    case 'BOOKING_CANCELLED':
      return {
        subject: `Booking cancelled — ${data.packageTitle}`,
        html: `<p>Hi,</p><p>Your booking for <strong>${data.packageTitle}</strong> (${formatDate(data.startDate)} – ${formatDate(data.endDate)}) has been cancelled.</p>${FOOTER}`,
      }
  }
}
