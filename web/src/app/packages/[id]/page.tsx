import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPackage, getPackageReviews } from "@/lib/api";
import {
  CATEGORY_LABELS,
  formatDuration,
  formatPrice,
  formatReviewDate,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Package details",
};

export default function PackagePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/" className="inline-flex min-h-11 items-center font-medium text-brand underline underline-offset-4">
        All packages
      </Link>
      {/* params is only known per request, so it is read behind this boundary. */}
      <Suspense fallback={<DetailSkeleton />}>
        <PackageDetail params={params} />
      </Suspense>
    </div>
  );
}

async function PackageDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = await getPackage(id);
  if (!pkg) {
    notFound();
  }

  return (
    <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_20rem]">
      <article>
        {pkg.imageUrl ? (
          <div className="relative mb-6 aspect-[3/2] w-full overflow-hidden bg-line sm:aspect-[2/1]">
            <Image
              src={pkg.imageUrl}
              alt={`${pkg.title}, ${pkg.dzongkhag}`}
              fill
              priority
              sizes="(min-width: 1024px) 700px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <p className="text-base font-semibold text-muted">{CATEGORY_LABELS[pkg.category]}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {pkg.title}
        </h1>
        <p className="mt-4 max-w-prose text-lg">{pkg.description}</p>

        <dl className="mt-8 grid max-w-prose grid-cols-[auto_1fr] gap-x-8 gap-y-3 border-t border-line pt-6 text-base">
          <dt className="font-semibold">Dzongkhag</dt>
          <dd>{pkg.dzongkhag}</dd>
          <dt className="font-semibold">Length</dt>
          <dd>{formatDuration(pkg.durationDays)}</dd>
          <dt className="font-semibold">Guide and vehicle</dt>
          <dd>A licensed local guide and a vehicle are assigned to your booking.</dd>
          {pkg.requiresSpecialPermit ? (
            <>
              <dt className="font-semibold text-maroon">Permit</dt>
              <dd className="font-medium text-maroon">This package requires a special permit.</dd>
            </>
          ) : null}
        </dl>

        <Suspense fallback={<p className="mt-12 text-muted">Loading reviews</p>}>
          <Reviews id={id} />
        </Suspense>
      </article>

      <aside className="h-fit border border-line bg-paper p-6">
        <p className="font-display text-3xl font-semibold">
          {formatPrice(pkg.basePrice, pkg.currency)}
        </p>
        <p className="mt-1 text-base text-muted">package price</p>
        <p className="mt-4 text-base">
          Your Sustainable Development Fee is calculated when you book and is added to this price.
        </p>
      </aside>
    </div>
  );
}

async function Reviews({ id }: { id: string }) {
  const { reviews, averageRating, count } = await getPackageReviews(id);

  return (
    <section aria-labelledby="reviews-heading" className="mt-12 border-t border-line pt-8">
      <h2 id="reviews-heading" className="font-display text-2xl font-semibold">
        Reviews
      </h2>
      {count === 0 || averageRating === null ? (
        <p className="mt-3 text-muted">No reviews yet.</p>
      ) : (
        <>
          <p className="mt-3 text-lg">
            <span className="font-semibold">{averageRating.toFixed(1)} out of 5</span>{" "}
            <span className="text-muted">from {count} {count === 1 ? "review" : "reviews"}</span>
          </p>
          <ul className="mt-6 max-w-prose space-y-6">
            {reviews.map((review) => (
              <li key={review.id} className="border-l-4 border-line pl-4">
                <p className="font-semibold">{review.packageRating} out of 5</p>
                {review.packageComment ? <p className="mt-1">{review.packageComment}</p> : null}
                <p className="mt-1 text-sm text-muted">
                  {review.reviewerName}, {formatReviewDate(review.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-4">
      <p role="status" className="sr-only">
        Loading package
      </p>
      <div aria-hidden="true" className="space-y-4">
        <div className="h-5 w-32 bg-line" />
        <div className="h-10 w-3/4 bg-line" />
        <div className="h-24 max-w-prose bg-line" />
      </div>
    </div>
  );
}
