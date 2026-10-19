import type { Metadata } from "next";
import Link from "next/link";
import { BookingProgress } from "@/components/booking-progress";
import { BookingShell } from "@/components/booking-shell";
import { FeeSummary } from "@/components/fee-summary";
import { loadBookingFlow } from "../load-booking";
import { FeeForm } from "../fee-form";

export const metadata: Metadata = {
  title: "Your fee",
  robots: { index: false },
};

const buttonClass =
  "inline-flex min-h-11 items-center bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep";

export default function FeePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <BookingShell>
      <FeeStep params={params} />
    </BookingShell>
  );
}

async function FeeStep({ params }: { params: Promise<{ id: string }> }) {
  const { booking, steps } = await loadBookingFlow(params, "/fee");
  const editable = booking.status === "DRAFT" || booking.status === "SDF_CALCULATED";

  return (
    <article>
      <Link href={`/bookings/${booking.id}`} className="text-base text-brand underline underline-offset-4">
        Back to your booking
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Your fee</h1>
      <p className="mt-2 text-base text-muted">
        {booking.package.title}, {booking.travelerCount} {booking.travelerCount === 1 ? "traveller" : "travellers"}.
      </p>
      <div className="mt-6">
        <BookingProgress steps={steps} active="fee" />
      </div>

      {booking.sdfRecord ? <FeeSummary booking={booking} /> : null}

      {editable ? (
        <FeeForm
          bookingId={booking.id}
          travelerCount={booking.travelerCount}
          savedCategory={booking.sdfRecord?.travelerCategory ?? null}
          savedAges={booking.sdfRecord?.travelerAges ?? []}
        />
      ) : null}

      {booking.sdfRecord && editable ? (
        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-line pt-6">
          <Link href={`/bookings/${booking.id}/documents`} className={buttonClass}>
            Continue to documents
          </Link>
          <span className="text-sm text-muted">You can change the details above and recalculate at any time.</span>
        </div>
      ) : null}
    </article>
  );
}
