import type { Metadata } from "next";
import { Suspense } from "react";
import { safeNextPath } from "@/lib/safe-redirect";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Create an account",
};

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-2 text-base text-muted">An account lets you book a trip and upload your travel documents.</p>
      <Suspense fallback={<p className="mt-6 text-muted">Loading</p>}>
        <Form searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Form({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNextPath(Array.isArray(params.next) ? params.next[0] : params.next);
  return <RegisterForm next={next} />;
}
