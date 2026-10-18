"use server";

import { redirect } from "next/navigation";
import { MAX_TRAVELERS } from "@/lib/booking-rules";
import { TRAVELER_CATEGORY_LABELS, calculateFee, type TravelerCategory } from "@/lib/bookings-api";

export type FeeFormState = {
  error?: string;
  values?: { category: string; ages: string[] };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function submitFee(_previous: FeeFormState, formData: FormData): Promise<FeeFormState> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const category = String(formData.get("category") ?? "");
  const ageTexts = formData.getAll("age").map((value) => String(value));
  const values = { category, ages: ageTexts };

  if (!UUID.test(bookingId)) {
    return { error: "This booking could not be found.", values };
  }
  if (!Object.hasOwn(TRAVELER_CATEGORY_LABELS, category)) {
    return { error: "Choose who is travelling.", values };
  }
  if (ageTexts.length < 1 || ageTexts.length > MAX_TRAVELERS) {
    return { error: "Enter an age for every traveller.", values };
  }
  const ages = ageTexts.map((text) => (text.trim() === "" ? NaN : Number(text)));
  if (ages.some((age) => !Number.isInteger(age) || age < 0 || age > 120)) {
    return { error: "Enter an age from 0 to 120 for every traveller.", values };
  }

  const result = await calculateFee(bookingId, { travelerCategory: category as TravelerCategory, ages });
  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/bookings/${bookingId}`)}`);
    }
    return { error: result.error, values };
  }

  redirect(`/bookings/${bookingId}`);
}
