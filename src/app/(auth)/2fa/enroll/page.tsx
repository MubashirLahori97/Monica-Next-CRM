import { generate2FASecretAction } from '@/actions/auth.actions'
import { EnrollForm } from '@/components/auth/EnrollForm'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import QRCode from 'qrcode'

export default async function Enroll2FAPage() {
  const result = await generate2FASecretAction()

  if (result.error) {
    if (result.error === 'Already enrolled') {
      redirect('/dashboard')
    }
    return <div className="text-red-500">{result.error}</div>
  }

  const { secret, otpauth } = result
  
  if (!otpauth || !secret) {
     return <div className="text-red-500">Failed to generate 2FA</div>
  }

  const qrCodeDataUrl = await QRCode.toDataURL(otpauth)

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Set up Two-Factor Authentication</h1>
        <p className="text-sm text-zinc-400 mt-2">Scan this QR code with your authenticator app (e.g. Google Authenticator).</p>
      </div>

      <div className="flex justify-center bg-white p-4 rounded-xl">
        <Image src={qrCodeDataUrl} alt="QR Code" width={200} height={200} unoptimized />
      </div>

      <div className="text-center text-sm font-mono bg-zinc-950 border border-zinc-800 text-zinc-300 p-2 rounded-lg">
        {secret}
      </div>

      <EnrollForm />
    </div>
  )
}

