"use client";

import { useActionState } from "react";
import { TRAVELER_CATEGORY_LABELS, type TravelerCategory } from "@/lib/booking-labels";
import { submitFee, type FeeFormState } from "./actions";

const fieldClass = "min-h-11 w-full border border-muted bg-paper px-3 py-2 text-base";
const labelClass = "mb-1 block text-sm font-semibold";
const initialState: FeeFormState = {};

export function FeeForm({
  bookingId,
  travelerCount,
  savedCategory,
  savedAges,
}: {
  bookingId: string;
  travelerCount: number;
  savedCategory: TravelerCategory | null;
  savedAges: number[];
}) {
  const [state, formAction, pending] = useActionState(submitFee, initialState);
  const category = state.values?.category ?? savedCategory ?? "";

  return (
    <form action={formAction} className="mt-6 grid gap-4 border border-line bg-paper p-5">
      <h2 className="font-display text-xl font-semibold">Tell us who is travelling</h2>
      <p className="text-base text-muted">
        The Sustainable Development Fee is charged for each traveller and each night. Travellers under 6
        are exempt and travellers aged 6 to 12 pay half.
      </p>
      <input type="hidden" name="bookingId" value={bookingId} />
      <div>
        <label htmlFor="category" className={labelClass}>
          Who is travelling
        </label>
        <select id="category" name="category" required defaultValue={category} className={fieldClass}>
          <option value="" disabled>
            Choose one
          </option>
          {Object.entries(TRAVELER_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="grid gap-3">
        <legend className={labelClass}>Age of each traveller on the first day of the trip</legend>
        {Array.from({ length: travelerCount }, (_, index) => (
          <div key={index}>
            <label htmlFor={`age-${index}`} className="mb-1 block text-sm">
              Traveller {index + 1}
            </label>
            <input
              id={`age-${index}`}
              name="age"
              type="number"
              inputMode="numeric"
              required
              min={0}
              max={120}
              defaultValue={state.values?.ages[index] ?? savedAges[index] ?? ""}
              className={fieldClass}
            />
          </div>
        ))}
      </fieldset>
      <p role="alert" className="text-base font-medium text-maroon">
        {state.error}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
      >
        {pending ? "Calculating" : "Calculate fee"}
      </button>
    </form>
  );
}
