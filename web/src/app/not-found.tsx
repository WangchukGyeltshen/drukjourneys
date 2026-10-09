import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">We could not find that page</h1>
      <p className="mt-3 max-w-prose text-lg text-muted">
        The page may have moved, or the package is no longer offered.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center bg-brand px-5 py-2 text-base font-semibold text-white hover:bg-brand-deep"
      >
        See all packages
      </Link>
    </div>
  );
}
