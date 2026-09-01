export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] p-4">
      <div className="max-w-md w-full bg-zinc-900/50 p-8 border border-zinc-800 rounded-2xl shadow-xl backdrop-blur-xl">
        {children}
      </div>
    </div>
  )
}
