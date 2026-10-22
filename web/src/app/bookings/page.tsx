import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookingShell } from "@/components/booking-shell";
import { BOOKING_STATUS_LABELS, listMyBookings } from "@/lib/bookings-api";
import { BOOKING_NEXT_HINT } from "@/lib/booking-flow";
import { formatDay } from "@/lib/dates";

export const metadata: Metadata = {
  title: "My bookings",
  robots: { index: false },
};

export default function MyBookingsPage() {
  return (
    <BookingShell>
      <MyBookings />
    </BookingShell>
  );
}

async function MyBookings() {
  const result = await listMyBookings();
  if (result === "signed-out") {
    redirect(`/login?next=${encodeURIComponent("/bookings")}`);
  }

  return (
    <section>
      <h1 className="font-display text-3xl font-semibold tracking-tight">My bookings</h1>

      {result.bookings.length === 0 ? (
        <div className="mt-6 border border-line bg-paper p-5">
          <p className="text-base">You have not booked a trip yet.</p>
          <Link
            href="/#packages"
            className="mt-4 inline-flex min-h-11 items-center bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep"
          >
            Browse packages
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4">
          {result.bookings.map((booking) => (
            <li key={booking.id}>
              <Link
                href={`/bookings/${booking.id}`}
                className="block border border-line bg-paper p-5 hover:border-brand"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="font-display text-xl font-semibold">{booking.package.title}</h2>
                  <span
                    className={`border px-3 py-1 text-sm font-semibold ${
                      booking.status === "CONFIRMED"
                        ? "border-brand bg-brand text-white"
                        : booking.status === "CANCELLED"
                          ? "border-line bg-glacier text-muted"
                          : "border-brand bg-paper text-brand"
                    }`}
                  >
                    {BOOKING_STATUS_LABELS[booking.status]}
                  </span>
                </div>
                <p className="mt-2 text-base text-muted">
                  {formatDay(booking.startDate)} to {formatDay(booking.endDate)}, {booking.travelerCount}{" "}
                  {booking.travelerCount === 1 ? "traveller" : "travellers"}
                </p>
                <p className="mt-2 text-base font-medium">{BOOKING_NEXT_HINT[booking.status]}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {result.total > result.bookings.length ? (
        <p className="mt-4 text-sm text-muted">Showing your {result.bookings.length} most recent bookings.</p>
      ) : null}
    </section>
  );
}
