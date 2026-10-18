"use client";

import { useActionState, useState } from "react";
import { MAX_TRAVELERS, lastDayOffset } from "@/lib/booking-rules";
import { addDaysIso, formatDay, isValidIsoDate } from "@/lib/dates";
import { startBooking, type BookingFormState } from "./actions";

const fieldClass = "min-h-11 w-full border border-muted bg-paper px-3 py-2 text-base";
const labelClass = "mb-1 block text-sm font-semibold";
const initialState: BookingFormState = {};

export function BookingForm({
  packageId,
  durationDays,
  minDate,
}: {
  packageId: string;
  durationDays: number;
  minDate: string;
}) {
  const [state, formAction, pending] = useActionState(startBooking, initialState);
  const [startDate, setStartDate] = useState(state.values?.startDate ?? "");
  const errors = state.fieldErrors ?? {};

  const endDate =
    isValidIsoDate(startDate) && startDate >= minDate ? addDaysIso(startDate, lastDayOffset(durationDays)) : null;

  return (
    <form action={formAction} className="mt-6 grid gap-4 border-t border-line pt-6">
      <h2 className="font-display text-xl font-semibold">Book this trip</h2>
      <input type="hidden" name="packageId" value={packageId} />
      <div>
        <label htmlFor="startDate" className={labelClass}>
          Start date
        </label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          required
          min={minDate}
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          aria-invalid={errors.startDate ? true : undefined}
          aria-describedby="startDate-error trip-dates"
          className={fieldClass}
        />
        <p id="startDate-error" role="alert" className="mt-1 text-sm font-medium text-maroon">
          {errors.startDate}
        </p>
        <p id="trip-dates" className="mt-1 text-sm text-muted">
          {endDate
            ? `This ${durationDays}-day trip runs from ${formatDay(startDate)} to ${formatDay(endDate)}.`
            : `The end date is set for you: the trip lasts ${durationDays} days.`}
        </p>
      </div>
      <div>
        <label htmlFor="travelerCount" className={labelClass}>
          Number of travellers
        </label>
        <input
          id="travelerCount"
          name="travelerCount"
          type="number"
          inputMode="numeric"
          required
          min={1}
          max={MAX_TRAVELERS}
          defaultValue={state.values?.travelerCount ?? "1"}
          aria-invalid={errors.travelerCount ? true : undefined}
          aria-describedby="travelerCount-error"
          className={fieldClass}
        />
        <p id="travelerCount-error" role="alert" className="mt-1 text-sm font-medium text-maroon">
          {errors.travelerCount}
        </p>
      </div>
      <p role="alert" className="text-base font-medium text-maroon">
        {state.error}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
      >
        {pending ? "Creating booking" : "Book this trip"}
      </button>
      <p className="text-sm text-muted">Nothing is charged at this step.</p>
    </form>
  );
}
