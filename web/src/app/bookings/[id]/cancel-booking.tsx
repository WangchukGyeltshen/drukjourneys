"use client";

import { useState } from "react";
import { cancelMyBooking } from "./cancel-actions";

// Two-step cancel without a browser pop-up: the first press asks "Are you
// sure?" in the page, the second one cancels.
export function CancelBooking({ bookingId }: { bookingId: string }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmCancel() {
    setBusy(true);
    setError(null);
    const result = await cancelMyBooking(bookingId);
    if (result?.error) {
      setError(result.error);
      setBusy(false);
    }
  }

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="min-h-11 border border-maroon px-5 py-2 text-base font-semibold text-maroon hover:bg-maroon hover:text-white"
      >
        Cancel this booking
      </button>
    );
  }

  return (
    <div className="border border-maroon bg-paper p-4" role="group" aria-labelledby="cancel-question">
      <p id="cancel-question" className="text-base font-semibold">
        Cancel this booking?
      </p>
      <p className="mt-1 text-sm text-muted">
        Nothing has been charged. Your guide and vehicle, if assigned, are released, and any unfinished
        card payment is closed.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={confirmCancel}
          disabled={busy}
          className="min-h-11 bg-maroon px-5 py-2 text-base font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Cancelling" : "Yes, cancel it"}
        </button>
        <button
          type="button"
          onClick={() => setAsking(false)}
          disabled={busy}
          className="min-h-11 border border-line px-5 py-2 text-base font-semibold hover:bg-glacier"
        >
          Keep my booking
        </button>
      </div>
      <p role="alert" className="mt-2 text-sm font-medium text-maroon">
        {error}
      </p>
    </div>
  );
}
