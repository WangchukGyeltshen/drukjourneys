import type { Metadata } from "next";
import Link from "next/link";
import { BookingProgress } from "@/components/booking-progress";
import { BookingShell } from "@/components/booking-shell";
import { FeeSummary } from "@/components/fee-summary";
import { BOOKING_STATUS_LABELS, type Booking } from "@/lib/bookings-api";
import { canCancel } from "@/lib/booking-flow";
import { formatDay } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { CancelBooking } from "./cancel-booking";
import { loadBookingFlow } from "./load-booking";

export const metadata: Metadata = {
  title: "Your booking",
  // A private page: it should never appear in search results.
  robots: { index: false },
};

const buttonClass =
  "inline-flex min-h-11 items-center bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep";

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <BookingShell>
      <BookingOverview params={params} />
    </BookingShell>
  );
}

function nextStepCard(booking: Booking, documentsOk: boolean) {
  const base = `/bookings/${booking.id}`;
  switch (booking.status) {
    case "DRAFT":
      return {
        title: "Next: calculate your fee",
        text: "Tell us who is travelling so we can work out your Sustainable Development Fee.",
        action: { href: `${base}/fee`, label: "Calculate my fee" },
      };
    case "SDF_CALCULATED":
      return documentsOk
        ? {
            title: "Your documents are in",
            text: "Our team is assigning your guide and vehicle. When that is done you can pay to confirm the trip.",
            action: { href: `${base}/documents`, label: "View my documents" },
          }
        : {
            title: "Next: upload your travel documents",
            text: "We need your passport, visa and a passport-style photo before we can assign a guide.",
            action: { href: `${base}/documents`, label: "Upload documents" },
          };
    case "GUIDE_ASSIGNED":
      return {
        title: "Your guide is assigned. Pay to confirm.",
        text: "Pay by card to confirm your booking.",
        action: { href: `${base}/payment`, label: "Go to payment" },
      };
    case "CONFIRMED":
      return {
        title: "Your booking is confirmed and paid",
        text: "We have emailed you the details.",
        action: null,
      };
    case "CANCELLED":
      return { title: "This booking was cancelled", text: "Nothing more is needed.", action: null };
  }
}

async function BookingOverview({ params }: { params: Promise<{ id: string }> }) {
  const { booking, documentsOk, steps } = await loadBookingFlow(params, "");
  const card = nextStepCard(booking, documentsOk);

  return (
    <article>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Your booking</h1>
      <p className="mt-2 text-lg">
        Status: <strong>{BOOKING_STATUS_LABELS[booking.status]}</strong>
      </p>

      <div className="mt-6">
        <BookingProgress steps={steps} />
      </div>

      <section className="border border-brand bg-paper p-5" aria-labelledby="next-heading">
        <h2 id="next-heading" className="font-display text-xl font-semibold">
          {card.title}
        </h2>
        <p className="mt-1 text-base text-muted">{card.text}</p>
        {card.action ? (
          <Link href={card.action.href} className={`${buttonClass} mt-4`}>
            {card.action.label}
          </Link>
        ) : null}
      </section>

      <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 border-t border-line pt-6 text-base">
        <dt className="font-semibold">Trip</dt>
        <dd>
          <Link href={`/packages/${booking.packageId}`} className="text-brand underline underline-offset-4">
            {booking.package.title}
          </Link>
        </dd>
        <dt className="font-semibold">Dates</dt>
        <dd>
          {formatDay(booking.startDate)} to {formatDay(booking.endDate)}
        </dd>
        <dt className="font-semibold">Travellers</dt>
        <dd>{booking.travelerCount}</dd>
        <dt className="font-semibold">Package price</dt>
        <dd>{formatPrice(booking.package.basePrice, booking.package.currency)} per person</dd>
      </dl>

      {booking.guideAssignment ? (
        <section className="mt-8 border border-line bg-paper p-5" aria-labelledby="team-heading">
          <h2 id="team-heading" className="font-display text-xl font-semibold">
            Your guide and vehicle
          </h2>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-base">
            <dt className="font-semibold">Guide</dt>
            <dd>{booking.guideAssignment.guide.name}</dd>
            <dt className="font-semibold">Vehicle</dt>
            <dd>
              {booking.guideAssignment.vehicle.type}, plate {booking.guideAssignment.vehicle.plateNumber}
            </dd>
          </dl>
        </section>
      ) : null}

      {booking.sdfRecord ? (
        <div className="mt-8">
          <FeeSummary booking={booking} />
        </div>
      ) : null}

      {canCancel(booking.status) ? (
        <div className="mt-8 border-t border-line pt-6">
          <CancelBooking bookingId={booking.id} />
        </div>
      ) : null}
      {booking.status === "CONFIRMED" ? (
        <p className="mt-8 border-t border-line pt-6 text-sm text-muted">
          A paid booking cannot be cancelled online. To cancel or change it, contact us and we will
          explain the refund policy.
        </p>
      ) : null}
    </article>
  );
}
