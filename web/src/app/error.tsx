"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        We could not load this page
      </h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        The package service did not respond. It may still be starting up, so try again in a moment.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 min-h-11 bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep"
      >
        Try again
      </button>
    </div>
  );
}
