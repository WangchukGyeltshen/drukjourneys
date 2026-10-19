"use client";

import { useActionState } from "react";
import type { RequiredDocumentType } from "@/lib/document-rules";
import { uploadTravelDocument, type DocumentFormState } from "./document-actions";

const initialState: DocumentFormState = {};

export function DocumentUploadForm({
  bookingId,
  docType,
  label,
  hasFile,
}: {
  bookingId: string;
  docType: RequiredDocumentType;
  label: string;
  hasFile: boolean;
}) {
  const [state, formAction, pending] = useActionState(uploadTravelDocument, initialState);
  const inputId = `file-${docType}`;

  return (
    <form action={formAction} className="mt-4 border-t border-line pt-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="docType" value={docType} />
      <label htmlFor={inputId} className="block text-sm font-semibold">
        {hasFile ? `Replace your ${label.toLowerCase()}` : `Choose your ${label.toLowerCase()}`}
      </label>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          id={inputId}
          name="file"
          type="file"
          required
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          aria-describedby={`${inputId}-hint ${inputId}-error`}
          className="min-h-11 w-full min-w-0 flex-1 border border-dashed border-muted bg-glacier px-3 py-2 text-base file:mr-4 file:min-h-9 file:cursor-pointer file:border-0 file:bg-ink file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-deep"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 shrink-0 bg-brand px-6 py-2 text-base font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
        >
          {pending ? "Uploading" : "Upload"}
        </button>
      </div>
      <p id={`${inputId}-hint`} className="mt-2 text-sm text-muted">
        PDF, JPG or PNG, up to 10 MB.
      </p>
      <p id={`${inputId}-error`} role="alert" className="mt-1 text-sm font-medium text-maroon">
        {state.error}
      </p>
    </form>
  );
}
