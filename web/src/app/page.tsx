import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FilterBar } from "@/components/filter-bar";
import { HomeHero } from "@/components/home-hero";
import { PackageCard } from "@/components/package-card";
import { PaginationNav } from "@/components/pagination-nav";
import { listPackages } from "@/lib/api";
import { PAGE_SIZE, parseFilters, toQuery, type RawSearchParams } from "@/lib/filters";

export const metadata: Metadata = {
  title: "Tour packages in Bhutan",
};

export default function HomePage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  return (
    <>
      <HomeHero />
      <section
        id="packages"
        aria-labelledby="packages-heading"
        className="mx-auto w-full max-w-6xl scroll-mt-4 px-4 py-10 sm:px-6"
      >
        <h2 id="packages-heading" className="font-display text-3xl font-semibold tracking-tight">
          Tour packages
        </h2>
        <p className="mt-3 max-w-prose text-lg text-muted">
          The price shown is for the package. Your Sustainable Development Fee is added when you book.
        </p>
        {/* searchParams is only known per request, so everything that reads it
            streams in behind this boundary while the heading renders at once. */}
        <Suspense fallback={<BrowseSkeleton />}>
          <Browse searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}

async function Browse({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const filters = parseFilters(await searchParams);
  const { packages, pagination } = await listPackages({
    dzongkhag: filters.dzongkhag,
    category: filters.category,
    maxDurationDays: filters.maxDurationDays,
    page: filters.page,
    pageSize: PAGE_SIZE,
  });
  const hasFilters = Boolean(filters.dzongkhag || filters.category || filters.maxDurationDays);

  return (
    <div className="mt-8 space-y-6">
      <FilterBar filters={filters} showClear={hasFilters} />
      <p role="status" className="text-base text-muted">
        {pagination.total} {pagination.total === 1 ? "package" : "packages"}
      </p>
      {packages.length === 0 ? (
        <div className="border border-line bg-paper p-8">
          <h2 className="font-display text-xl font-semibold">No packages match these filters</h2>
          <p className="mt-2 text-muted">
            Try a different dzongkhag or type of trip, or{" "}
            <Link href="/#packages" className="font-medium text-brand underline underline-offset-4">
              clear the filters
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, index) => (
            <li key={pkg.id} className="flex">
              <PackageCard pkg={pkg} priority={index < 3} />
            </li>
          ))}
        </ul>
      )}
      <PaginationNav pagination={pagination} query={toQuery(filters)} />
    </div>
  );
}

function BrowseSkeleton() {
  return (
    <div className="mt-8 space-y-6">
      <p role="status" className="sr-only">
        Loading packages
      </p>
      <div aria-hidden="true" className="h-28 border border-line bg-paper" />
      <ul aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="h-56 border border-line bg-paper motion-safe:animate-pulse" />
        ))}
      </ul>
    </div>
  );
}
