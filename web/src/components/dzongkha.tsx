import type { ReactNode } from 'react'

// Wrap any Dzongkha text in this. The language tag lets screen readers pick
// the right voice, lets the browser choose the right font and hyphenation,
// and switches on the taller line height set in globals.css.
export function Dzongkha({ children }: { children: ReactNode }) {
  return <span lang="dz">{children}</span>
}
