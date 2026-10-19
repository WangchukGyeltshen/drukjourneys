import Link from "next/link";
import type { FlowStep } from "@/lib/booking-flow";

function StepMark({ state, number }: { state: FlowStep["state"]; number: number }) {
  if (state === "done") {
    return (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-white" aria-hidden="true">
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
        state === "current" ? "border-brand bg-paper text-brand" : "border-line bg-paper text-muted"
      }`}
      aria-hidden="true"
    >
      {number}
    </span>
  );
}

export function BookingProgress({ steps, active }: { steps: FlowStep[]; active?: string }) {
  return (
    <nav aria-label="Booking steps" className="mb-8">
      <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {steps.map((step, index) => {
          const inner = (
            <>
              <StepMark state={step.state} number={index + 1} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{step.label}</span>
                <span className="block text-xs text-muted">
                  {step.state === "done" ? "Done" : step.state === "current" ? "Next" : "Later"}
                </span>
              </span>
            </>
          );
          const base = "flex min-h-11 items-center gap-3 border-t-4 bg-paper px-3 py-2";
          const tone = step.key === active ? "border-brand" : step.state === "done" ? "border-brand/40" : "border-line";
          return (
            <li key={step.key}>
              {step.href ? (
                <Link
                  href={step.href}
                  aria-current={step.key === active ? "step" : undefined}
                  className={`${base} ${tone} hover:bg-glacier`}
                >
                  {inner}
                </Link>
              ) : (
                <div className={`${base} ${tone}`}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
