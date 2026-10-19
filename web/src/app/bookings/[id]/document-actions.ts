"use server";

import { redirect } from "next/navigation";
import { ALLOWED_DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, REQUIRED_DOCUMENT_TYPES, type RequiredDocumentType } from "@/lib/document-rules";
import { uploadDocument } from "@/lib/documents-api";

export type DocumentFormState = { error?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function uploadTravelDocument(
  _previous: DocumentFormState,
  formData: FormData,
): Promise<DocumentFormState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const docType = String(formData.get("docType") ?? "");
  const file = formData.get("file");

  if (!UUID.test(bookingId) || !REQUIRED_DOCUMENT_TYPES.includes(docType as RequiredDocumentType)) {
    return { error: "This upload could not be processed." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return { error: "Upload a PDF, JPG or PNG file." };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: "The file is too large. The limit is 10 MB." };
  }

  const result = await uploadDocument(docType as RequiredDocumentType, file);
  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/bookings/${bookingId}/documents`)}`);
    }
    return { error: result.error };
  }

  redirect(`/bookings/${bookingId}/documents`);
}
