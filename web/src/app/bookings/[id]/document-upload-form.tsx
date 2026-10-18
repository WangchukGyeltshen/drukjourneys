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
    <form action={formAction} className="mt-3 grid gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="docType" value={docType} />
      <label htmlFor={inputId} className="text-sm font-semibold">
        {hasFile ? `Replace your ${label.toLowerCase()}` : `Upload your ${label.toLowerCase()}`}
      </label>
      <input
        id={inputId}
        name="file"
        type="file"
        required
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        aria-describedby={`${inputId}-hint ${inputId}-error`}
        className="min-h-11 w-full border border-muted bg-paper px-3 py-2 text-base"
      />
      <p id={`${inputId}-hint`} className="text-sm text-muted">
        PDF, JPG or PNG, up to 10 MB.
      </p>
      <p id={`${inputId}-error`} role="alert" className="text-sm font-medium text-maroon">
        {state.error}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-fit border border-brand px-5 py-2 text-base font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-60"
      >
        {pending ? "Uploading" : "Upload"}
      </button>
    </form>
  );
}
