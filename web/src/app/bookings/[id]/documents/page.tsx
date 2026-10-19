import type { Metadata } from "next";
import Link from "next/link";
import { BookingProgress } from "@/components/booking-progress";
import { BookingShell } from "@/components/booking-shell";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  REQUIRED_DOCUMENT_TYPES,
  type DocumentStatus,
} from "@/lib/document-rules";
import { loadBookingFlow } from "../load-booking";
import { DocumentUploadForm } from "../document-upload-form";

export const metadata: Metadata = {
  title: "Travel documents",
  robots: { index: false },
};

const buttonClass =
  "inline-flex min-h-11 items-center bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep";

const PILL_CLASSES: Record<DocumentStatus | "NONE", string> = {
  NONE: "border-line bg-glacier text-muted",
  PENDING: "border-brand bg-paper text-brand",
  SUBMITTED: "border-brand bg-paper text-brand",
  APPROVED: "border-brand bg-brand text-white",
  REJECTED: "border-maroon bg-paper text-maroon",
};

const PILL_TEXT: Record<DocumentStatus | "NONE", string> = {
  NONE: "Not uploaded",
  PENDING: "Waiting for review",
  SUBMITTED: "Waiting for review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export default function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <BookingShell>
      <DocumentsStep params={params} />
    </BookingShell>
  );
}

async function DocumentsStep({ params }: { params: Promise<{ id: string }> }) {
  const { booking, documents, documentsOk, steps } = await loadBookingFlow(params, "/documents");
  const open = booking.status !== "CONFIRMED" && booking.status !== "CANCELLED";

  return (
    <article>
      <Link href={`/bookings/${booking.id}`} className="text-base text-brand underline underline-offset-4">
        Back to your booking
      </Link>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Travel documents</h1>
      <p className="mt-2 text-base text-muted">
        We need your passport, visa and a passport-style photo before we can assign your guide. Our team
        reviews each file. Only you and authorised staff can see them.
      </p>
      <div className="mt-6">
        <BookingProgress steps={steps} active="documents" />
      </div>

      <ul className="grid gap-5">
        {REQUIRED_DOCUMENT_TYPES.map((docType) => {
          const latest = documents.find((document) => document.docType === docType);
          const key = latest ? latest.status : "NONE";
          return (
            <li key={docType} className="border border-line bg-paper p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-xl font-semibold">{DOCUMENT_TYPE_LABELS[docType]}</h2>
                <span className={`border px-3 py-1 text-sm font-semibold ${PILL_CLASSES[key]}`}>{PILL_TEXT[key]}</span>
              </div>
              <p className="mt-2 text-base">
                {latest ? (
                  <>
                    <span className="break-all text-muted">{latest.originalFilename}</span>
                    {latest.status === "REJECTED" ? (
                      <span className="mt-1 block font-medium text-maroon">{DOCUMENT_STATUS_LABELS.REJECTED}</span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-muted">Nothing uploaded yet.</span>
                )}
              </p>
              {open ? (
                <DocumentUploadForm
                  bookingId={booking.id}
                  docType={docType}
                  label={DOCUMENT_TYPE_LABELS[docType]}
                  hasFile={Boolean(latest)}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-8 border-t border-line pt-6">
        {documentsOk ? (
          <>
            <p className="text-base">
              <strong>All three documents are in.</strong> Our team will review them and assign your guide and
              vehicle. We will email you when you can pay.
            </p>
            <Link href={`/bookings/${booking.id}`} className={`${buttonClass} mt-4`}>
              Back to your booking
            </Link>
          </>
        ) : (
          <p className="text-base text-muted">Upload all three documents to continue.</p>
        )}
      </div>
    </article>
  );
}
