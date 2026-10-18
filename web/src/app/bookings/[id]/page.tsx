import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { BOOKING_STATUS_LABELS, TRAVELER_CATEGORY_LABELS, getBooking } from "@/lib/bookings-api";
import { formatDay } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_TYPE_LABELS, REQUIRED_DOCUMENT_TYPES } from "@/lib/document-rules";
import { listMyDocuments } from "@/lib/documents-api";
import { DocumentUploadForm } from "./document-upload-form";
import { FeeForm } from "./fee-form";

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

  const documents = await listMyDocuments();
  const packageTotal = Math.round(Number(booking.package.basePrice) * booking.travelerCount * 100) / 100;

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
        <dd>{formatPrice(booking.package.basePrice, booking.package.currency)} per person</dd>
      </dl>
      {booking.sdfRecord ? (
        <section className="mt-8 border-t border-line pt-6" aria-labelledby="fee-heading">
          <h2 id="fee-heading" className="font-display text-xl font-semibold">
            Sustainable Development Fee
          </h2>
          <p className="mt-2 text-base text-muted">
            {TRAVELER_CATEGORY_LABELS[booking.sdfRecord.travelerCategory]}, {booking.sdfRecord.nights} nights at{" "}
            {formatPrice(booking.sdfRecord.ratePerNight, booking.sdfRecord.currency)} per night for each adult.
          </p>
          <p className="mt-3 text-2xl font-semibold">
            {formatPrice(booking.sdfRecord.totalSdf, booking.sdfRecord.currency)}
          </p>
          {booking.sdfRecord.currency === booking.package.currency ? (
            <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 border-t border-line pt-4 text-base">
              <dt>
                Package, {booking.travelerCount} {booking.travelerCount === 1 ? "traveller" : "travellers"}
              </dt>
              <dd className="text-right">{formatPrice(String(packageTotal), booking.package.currency)}</dd>
              <dt>Sustainable Development Fee</dt>
              <dd className="text-right">{formatPrice(booking.sdfRecord.totalSdf, booking.sdfRecord.currency)}</dd>
              <dt className="font-semibold">Total to pay</dt>
              <dd className="text-right font-semibold">{formatPrice(String(packageTotal + Number(booking.sdfRecord.totalSdf)), booking.package.currency)}</dd>
            </dl>
          ) : null}
        </section>
      ) : null}
      {booking.status === "DRAFT" || booking.status === "SDF_CALCULATED" ? (
        <FeeForm
          bookingId={booking.id}
          travelerCount={booking.travelerCount}
          savedCategory={booking.sdfRecord?.travelerCategory ?? null}
          savedAges={booking.sdfRecord?.travelerAges ?? []}
        />
      ) : null}
      {booking.status !== "CANCELLED" ? (
        <section className="mt-8 border-t border-line pt-6" aria-labelledby="documents-heading">
          <h2 id="documents-heading" className="font-display text-xl font-semibold">
            Travel documents
          </h2>
          <p className="mt-2 text-base text-muted">
            We need your passport, visa and a passport-style photo before you can pay. Our team reviews
            each file. Only you and authorised staff can see them.
          </p>
          <ul className="mt-4 grid gap-6">
            {REQUIRED_DOCUMENT_TYPES.map((docType) => {
              // The list is newest first, so the first match is the latest upload.
              const latest = documents.find((document) => document.docType === docType);
              return (
                <li key={docType} className="border border-line bg-paper p-4">
                  <h3 className="text-lg font-semibold">{DOCUMENT_TYPE_LABELS[docType]}</h3>
                  <p className="mt-1 text-base">
                    {latest ? (
                      <>
                        <strong>{DOCUMENT_STATUS_LABELS[latest.status]}</strong>
                        <span className="text-muted">, {latest.originalFilename}</span>
                      </>
                    ) : (
                      <span className="text-muted">Not uploaded yet</span>
                    )}
                  </p>
                  <DocumentUploadForm
                    bookingId={booking.id}
                    docType={docType}
                    label={DOCUMENT_TYPE_LABELS[docType]}
                    hasFile={Boolean(latest)}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <p className="mt-8 border border-line bg-paper p-4 text-base">
        Nothing has been charged yet. Payment is the next step and is coming soon.
      </p>
    </article>
  );
}
