"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type FormState } from "./actions";

const fieldClass = "min-h-11 w-full border border-muted bg-paper px-3 py-2 text-base";
const labelClass = "mb-1 block text-sm font-semibold";
const initialState: FormState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-4 border border-line bg-paper p-6">
      <input type="hidden" name="next" value={next} />
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
          defaultValue={state.email}
          aria-describedby={state.error ? "login-error" : undefined}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
        />
      </div>
      <p id="login-error" role="alert" className="min-h-6 text-base font-medium text-maroon">
        {state.error}
      </p>
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep disabled:opacity-60"
      >
        {pending ? "Signing in" : "Sign in"}
      </button>
      <p className="text-base">
        New here?{" "}
        <Link href={next === "/" ? "/register" : `/register?next=${encodeURIComponent(next)}`} className="text-brand underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </form>
  );
}
