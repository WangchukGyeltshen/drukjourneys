import { notFound, redirect } from "next/navigation";
import { getBooking } from "@/lib/bookings-api";
import { documentsComplete, flowSteps } from "@/lib/booking-flow";
import { listMyDocuments } from "@/lib/documents-api";

// Shared by every page of the booking flow: loads the booking and the
// traveller's documents, sends signed-out visitors to sign in and returns
// the progress steps for the header.
export async function loadBookingFlow(params: Promise<{ id: string }>, subPath: string) {
  const { id } = await params;
  const booking = await getBooking(id);
  if (booking === "signed-out") {
    redirect(`/login?next=${encodeURIComponent(`/bookings/${id}${subPath}`)}`);
  }
  if (!booking) {
    notFound();
  }
  const documents = await listMyDocuments();
  const documentsOk = documentsComplete(documents);
  return { booking, documents, documentsOk, steps: flowSteps(booking, documentsOk) };
}
