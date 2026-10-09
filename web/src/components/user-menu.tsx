import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth-api'
import { logout } from '@/app/login/actions'

// Reads the session cookie, so it must render behind a Suspense boundary.
export async function UserMenu() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <Link href="/login" className="underline-offset-4 hover:underline">
        Sign in
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="hidden sm:inline">{user.fullName}</span>
      <form action={logout}>
        <button type="submit" className="min-h-11 underline-offset-4 hover:underline">
          Sign out
        </button>
      </form>
    </div>
  )
}
