import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="bg-ink text-white [&_:focus-visible]:outline-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          DrukJourneys
        </Link>
        <nav aria-label="Main">
          <ul className="flex gap-6">
            <li>
              <Link href="/" className="underline-offset-4 hover:underline">
                Packages
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
