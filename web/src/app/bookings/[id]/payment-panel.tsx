"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { finishPayment, startPayment } from "./payment-actions";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const buttonClass =
  "min-h-11 bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep disabled:opacity-60";

export function PaymentPanel({ bookingId, totalLabel }: { bookingId: string; totalLabel: string }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function begin() {
    setBusy(true);
    setError(null);
    const result = await startPayment(bookingId);
    setBusy(false);
    if (result.clientSecret) {
      setClientSecret(result.clientSecret);
    } else {
      setError(result.error ?? "The payment could not be started.");
    }
  }

  return (
    <section className="mt-8 border-t border-line pt-6" aria-labelledby="payment-heading">
      <h2 id="payment-heading" className="font-display text-xl font-semibold">
        Pay for your trip
      </h2>
      <p className="mt-2 text-base text-muted">
        Your guide and vehicle are assigned. Pay {totalLabel} by card to confirm the booking.
      </p>
      {!stripePromise ? (
        <p role="alert" className="mt-4 text-base font-medium text-maroon">
          Card payments are not set up on this site yet.
        </p>
      ) : clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CardForm bookingId={bookingId} totalLabel={totalLabel} />
        </Elements>
      ) : (
        <div className="mt-4 grid gap-3">
          <button type="button" onClick={begin} disabled={busy} className={`${buttonClass} w-fit`}>
            {busy ? "Starting payment" : `Pay ${totalLabel}`}
          </button>
          <p role="alert" className="text-base font-medium text-maroon">
            {error}
          </p>
        </div>
      )}
    </section>
  );
}

function CardForm({ bookingId, totalLabel }: { bookingId: string; totalLabel: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (error) {
      setMessage(error.message ?? "The payment did not go through. Please try again.");
      setBusy(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      const result = await finishPayment(bookingId);
      if (result.error) {
        setMessage(`Your payment went through, but we could not update the booking yet. ${result.error}`);
      }
      router.refresh();
      return;
    }
    setMessage("Your payment is being processed. Reload this page in a moment.");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-4">
      <PaymentElement />
      <p role="alert" className="text-base font-medium text-maroon">
        {message}
      </p>
      <button type="submit" disabled={!stripe || busy} className={`${buttonClass} w-fit`}>
        {busy ? "Processing" : `Pay ${totalLabel}`}
      </button>
    </form>
  );
}
