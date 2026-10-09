"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, type RegisterState } from "./actions";

const fieldClass = "min-h-11 w-full border border-muted bg-paper px-3 py-2 text-base";
const labelClass = "mb-1 block text-sm font-semibold";
const initialState: RegisterState = {};

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  return (
    <p id={id} role="alert" className="mt-1 text-sm font-medium text-maroon">
      {messages?.[0]}
    </p>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(register, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="mt-6 grid gap-4 border border-line bg-paper p-6">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="fullName" className={labelClass}>
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          defaultValue={state.values?.fullName}
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby="fullName-error"
          className={fieldClass}
        />
        <FieldError id="fullName-error" messages={errors.fullName} />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.values?.email}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby="email-error"
          className={fieldClass}
        />
        <FieldError id="email-error" messages={errors.email} />
      </div>
      <div>
        <label htmlFor="nationality" className={labelClass}>
          Nationality <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="nationality"
          name="nationality"
          type="text"
          autoComplete="country-name"
          defaultValue={state.values?.nationality}
          aria-invalid={errors.nationality ? true : undefined}
          aria-describedby="nationality-error"
          className={fieldClass}
        />
        <FieldError id="nationality-error" messages={errors.nationality} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={errors.password ? true : undefined}
          aria-describedby="password-hint password-error"
          className={fieldClass}
        />
        <p id="password-hint" className="mt-1 text-sm text-muted">
          At least 8 characters, with a lowercase letter, an uppercase letter, a number and a symbol.
        </p>
        <FieldError id="password-error" messages={errors.password} />
      </div>
      <p role="alert" className="text-base font-medium text-maroon">
        {state.error}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
      >
        {pending ? "Creating account" : "Create account"}
      </button>
      <p className="text-base">
        Already have an account?{" "}
        <Link href={next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`} className="text-brand underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
