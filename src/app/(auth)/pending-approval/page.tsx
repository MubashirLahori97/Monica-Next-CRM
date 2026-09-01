import Link from 'next/link'

export default function PendingApprovalPage() {
  return (
    <div className="text-center flex flex-col items-center gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Approval Pending</h1>
      <p className="text-sm text-gray-500">
        Your account is currently waiting for Super Admin approval. You will be able to sign in once your access is granted.
      </p>
      <Link href="/signin" className="mt-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-black text-white shadow h-9 px-4 py-2 hover:bg-black/90">
        Return to Sign In
      </Link>
    </div>
  )
}
