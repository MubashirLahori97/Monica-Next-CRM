import { verifyEmailAction } from '@/actions/auth.actions'
import Link from 'next/link'

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const resolvedParams = await searchParams
  const token = resolvedParams.token


  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-red-600">Missing Token</h1>
        <p className="text-sm text-gray-500 mt-2">No verification token was provided.</p>
        <Link href="/signin" className="mt-4 inline-block underline text-sm">Return to Sign In</Link>
      </div>
    )
  }

  const result = await verifyEmailAction(token)

  return (
    <div className="text-center flex flex-col items-center gap-4">
      {result.error ? (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-red-600">Verification Failed</h1>
          <p className="text-sm text-gray-500">{result.error}</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold tracking-tight text-green-600">Email Verified!</h1>
          <p className="text-sm text-gray-500">Your email has been verified. Your account is now pending Super Admin approval.</p>
        </>
      )}
      <Link href="/signin" className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-black text-white shadow h-9 px-4 py-2 hover:bg-black/90">
        Return to Sign In
      </Link>
    </div>
  )
}
