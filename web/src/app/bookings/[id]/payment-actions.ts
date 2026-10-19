"use server";

import { redirect } from "next/navigation";
import { createPaymentIntent, syncPayment } from "@/lib/payments-api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StartPaymentResult = { clientSecret?: string; error?: string };

export async function startPayment(bookingId: string): Promise<StartPaymentResult> {
  if (!UUID.test(bookingId)) {
    return { error: "This booking could not be found." };
  }
  const result = await createPaymentIntent(bookingId);
  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/bookings/${bookingId}`)}`);
    }
    return { error: result.error };
  }
  return { clientSecret: result.clientSecret };
}

export async function finishPayment(bookingId: string): Promise<{ paid: boolean; error?: string }> {
  if (!UUID.test(bookingId)) {
    return { paid: false, error: "This booking could not be found." };
  }
  const result = await syncPayment(bookingId);
  if (!result.ok) {
    return { paid: false, error: result.error };
  }
  return { paid: result.paid };
}
