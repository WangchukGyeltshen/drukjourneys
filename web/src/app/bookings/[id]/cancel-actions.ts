"use server";

import { redirect } from "next/navigation";
import { cancelBooking } from "@/lib/bookings-api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function cancelMyBooking(bookingId: string): Promise<{ error?: string }> {
  if (!UUID.test(bookingId)) {
    return { error: "This booking could not be found." };
  }
  const result = await cancelBooking(bookingId);
  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/bookings/${bookingId}`)}`);
    }
    return { error: result.error };
  }
  redirect(`/bookings/${bookingId}`);
}
