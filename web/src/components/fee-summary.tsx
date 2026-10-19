import { TRAVELER_CATEGORY_LABELS, type Booking } from "@/lib/bookings-api";
import { bookingTotals } from "@/lib/booking-flow";
import { formatPrice } from "@/lib/format";

export function FeeSummary({ booking }: { booking: Booking }) {
  const sdf = booking.sdfRecord;
  if (!sdf) {
    return null;
  }
  const totals = bookingTotals(booking);
  return (
    <section className="border border-line bg-paper p-5" aria-labelledby="fee-heading">
      <h2 id="fee-heading" className="font-display text-xl font-semibold">
        Your price
      </h2>
      <p className="mt-1 text-sm text-muted">
        Sustainable Development Fee: {TRAVELER_CATEGORY_LABELS[sdf.travelerCategory]}, {sdf.nights} nights at{" "}
        {formatPrice(sdf.ratePerNight, sdf.currency)} per night for each adult.
      </p>
      <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 text-base">
        <dt>
          Package, {booking.travelerCount} {booking.travelerCount === 1 ? "traveller" : "travellers"}
        </dt>
        <dd className="text-right">{formatPrice(String(totals.packageTotal), booking.package.currency)}</dd>
        <dt>Sustainable Development Fee</dt>
        <dd className="text-right">{formatPrice(sdf.totalSdf, sdf.currency)}</dd>
        {totals.total !== null ? (
          <div className="col-span-2 mt-2 flex items-baseline justify-between gap-8 border-t border-line pt-3 text-lg font-semibold">
            <dt>Total to pay</dt>
            <dd>{formatPrice(String(totals.total), totals.currency)}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
