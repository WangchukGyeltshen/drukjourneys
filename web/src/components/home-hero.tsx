import Image from 'next/image'
import Link from 'next/link'

const PROMISES = [
  'A licensed local guide and a vehicle on every trip',
  'Your Sustainable Development Fee is calculated before you pay',
  'Packages that need a special permit are flagged up front',
]

export function HomeHero() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden bg-ink text-white">
      {/* The photo is decoration, so it has no alt text. The overlay keeps
          the text readable wherever the photo is bright: an even tint on
          phones, where the text spans the whole width, and a gradient from
          the text side on wider screens. */}
      <Image
        src="/packages/snowman-trek.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-center"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-ink/75 sm:bg-transparent sm:bg-linear-to-r sm:from-ink/90 sm:via-ink/75 sm:to-ink/30" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
        <p className="text-base font-semibold uppercase tracking-wide text-white/85">
          Guided tours across Bhutan
        </p>
        <h1
          id="hero-heading"
          className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl"
        >
          Find a trip in Bhutan
        </h1>
        <p className="mt-4 max-w-xl text-lg text-white/90">
          Choose a cultural tour, a festival or a high-altitude trek. Book online, upload your travel
          documents and pay securely, all in one place.
        </p>
        <div className="mt-8">
          <Link
            href="#packages"
            className="inline-flex min-h-11 items-center bg-white px-6 py-2 text-base font-semibold text-ink hover:bg-glacier"
          >
            Browse packages
          </Link>
        </div>
        <ul className="mt-12 grid max-w-4xl gap-3 border-t border-white/30 pt-6 text-base text-white/90 sm:grid-cols-3 sm:gap-6">
          {PROMISES.map((promise) => (
            <li key={promise}>{promise}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
