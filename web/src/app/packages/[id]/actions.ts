"use server";

import { redirect } from "next/navigation";
import { getPackage } from "@/lib/api";
import { createBooking } from "@/lib/bookings-api";
import { MAX_TRAVELERS, lastDayOffset } from "@/lib/booking-rules";
import { addDaysIso, isValidIsoDate, todayIso } from "@/lib/dates";

export type BookingFormState = {
  error?: string;
  fieldErrors?: { startDate?: string; travelerCount?: string };
  values?: { startDate: string; travelerCount: string };
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function startBooking(_previous: BookingFormState, formData: FormData): Promise<BookingFormState> {
  const packageId = String(formData.get("packageId") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const travelerText = String(formData.get("travelerCount") ?? "");
  const values = { startDate, travelerCount: travelerText };

  if (!UUID.test(packageId)) {
    return { error: "This package could not be found.", values };
  }

  const fieldErrors: NonNullable<BookingFormState["fieldErrors"]> = {};
  if (!isValidIsoDate(startDate)) {
    fieldErrors.startDate = "Choose a start date.";
  } else if (startDate < todayIso()) {
    fieldErrors.startDate = "The start date cannot be in the past.";
  }
  const travelerCount = Number(travelerText);
  if (!Number.isInteger(travelerCount) || travelerCount < 1 || travelerCount > MAX_TRAVELERS) {
    fieldErrors.travelerCount = `Enter a number from 1 to ${MAX_TRAVELERS}.`;
  }
  if (fieldErrors.startDate || fieldErrors.travelerCount) {
    return { fieldErrors, values };
  }

  // The package is looked up here, so the trip length never comes from the form.
  const pkg = await getPackage(packageId);
  if (!pkg) {
    return { error: "This package is no longer available.", values };
  }

  const result = await createBooking({
    packageId,
    startDate,
    endDate: addDaysIso(startDate, lastDayOffset(pkg.durationDays)),
    travelerCount,
  });

  if (!result.ok) {
    if (result.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/packages/${packageId}`)}`);
    }
    return { error: result.error, values };
  }

  redirect(`/bookings/${result.booking.id}/fee`);
}
