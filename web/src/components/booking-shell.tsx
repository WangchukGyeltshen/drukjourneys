import { Suspense, type ReactNode } from "react";

// Common frame for every booking page. The page content reads the session
// and the route params, so it renders behind a Suspense boundary.
export function BookingShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Suspense fallback={<p className="text-muted">Loading your booking</p>}>{children}</Suspense>
    </div>
  );
}
