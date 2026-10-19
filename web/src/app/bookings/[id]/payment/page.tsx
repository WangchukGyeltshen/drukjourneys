import type { Metadata } from "next";
import Link from "next/link";
import { BookingProgress } from "@/components/booking-progress";
import { BookingShell } from "@/components/booking-shell";
import { FeeSummary } from "@/components/fee-summary";
import { bookingTotals } from "@/lib/booking-flow";
import { formatPrice } from "@/lib/format";
import { loadBookingFlow } from "../load-booking";
import { PaymentPanel } from "../payment-panel";

export const metadata: Metadata = {
  title: "Payment",
  robots: { index: false },
};

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <BookingShell>
      <PaymentStep params={params} />
    </BookingShell>
  );
}

async function PaymentStep({ params }: { params: Promise<{ id: string }> }) {
  const { booking, steps } = await loadBookingFlow(params, "/payment");
  const totals = bookingTotals(booking);
  const base = `/bookings/${booking.id}`;
  const canPay = booking.status === "GUIDE_ASSIGNED" && totals.total !== null;

  return (
    <article>
      <Link href={base} className="text-base text-brand underline underline-offset-4">
        Back to your booking
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Payment</h1>
      <div className="mt-6">
        <BookingProgress steps={steps} active="payment" />
      </div>

      {booking.status === "CONFIRMED" ? (
        <section className="border border-brand bg-paper p-5">
          <h2 className="font-display text-xl font-semibold">Your booking is confirmed and paid</h2>
          <p className="mt-1 text-base text-muted">We have emailed you the details.</p>
          <Link
            href={base}
            className="mt-4 inline-flex min-h-11 items-center bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep"
          >
            Back to your booking
          </Link>
        </section>
      ) : null}

      {canPay ? (
        <>
          <FeeSummary booking={booking} />
          <section className="mt-6 border border-line bg-paper p-5" aria-labelledby="card-heading">
            <h2 id="card-heading" className="font-display text-xl font-semibold">
              Pay by card
            </h2>
            <p className="mt-1 text-base text-muted">
              Your guide and vehicle are assigned. Pay to confirm the booking.
            </p>
            <PaymentPanel bookingId={booking.id} totalLabel={formatPrice(String(totals.total), totals.currency)} />
          </section>
        </>
      ) : null}

      {booking.status === "DRAFT" || booking.status === "SDF_CALCULATED" ? (
        <section className="border border-line bg-paper p-5">
          <h2 className="font-display text-xl font-semibold">Payment is not open yet</h2>
          <p className="mt-1 text-base text-muted">
            You can pay once your fee is calculated, your documents are uploaded and our team has assigned your
            guide and vehicle. We will email you when it is ready.
          </p>
          <Link href={base} className="mt-4 inline-block text-base text-brand underline underline-offset-4">
            See what is left to do
          </Link>
        </section>
      ) : null}

      {booking.status === "GUIDE_ASSIGNED" && !canPay ? (
        <p role="alert" className="text-base font-medium text-maroon">
          This booking cannot be paid by card here. Please contact support.
        </p>
      ) : null}

      {booking.status === "CANCELLED" ? (
        <p className="text-base text-muted">This booking was cancelled, so there is nothing to pay.</p>
      ) : null}
    </article>
  );
}
