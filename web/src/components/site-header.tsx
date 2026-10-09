import Link from 'next/link'

// The five prayer-flag colours in their traditional order.
const FLAG_COLORS = ['#1f6fb5', '#ffffff', '#c1272d', '#2e8b57', '#f2b705']

export function SiteHeader() {
  return (
    <header className="bg-ink text-white [&_:focus-visible]:outline-white">
      <div className="flex h-1.5" aria-hidden="true">
        {FLAG_COLORS.map((color) => (
          <span key={color} className="flex-1" style={{ backgroundColor: color }} />
        ))}
      </div>
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
