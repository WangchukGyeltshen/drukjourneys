import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BOOKING_STATUS_LABELS, getBooking } from "@/lib/bookings-api";
import { formatDay } from "@/lib/dates";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Your booking",
  // A private page: it should never appear in search results.
  robots: { index: false },
};

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading your booking</p>}>
        <BookingDetail params={params} />
      </Suspense>
    </div>
  );
}

async function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (booking === "signed-out") {
    redirect(`/login?next=${encodeURIComponent(`/bookings/${id}`)}`);
  }
  if (!booking) {
    notFound();
  }

  return (
    <article>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Your booking</h1>
      <p className="mt-2 text-lg">
        Status: <strong>{BOOKING_STATUS_LABELS[booking.status]}</strong>
      </p>
      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-8 gap-y-3 border-t border-line pt-6 text-base">
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
        <dd>{formatPrice(booking.package.basePrice, booking.package.currency)}</dd>
      </dl>
      <p className="mt-8 border border-line bg-paper p-4 text-base">
        Your booking is saved as a draft and nothing has been charged. The next steps, your
        Sustainable Development Fee, travel documents and payment, are coming soon.
      </p>
    </article>
  );
}
