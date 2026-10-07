import type { Metadata } from "next"
import { RegisterForm } from "@/components/register-form"
import { safeCallbackPath } from "@/lib/auth/validation"

export const metadata: Metadata = {
  title: "Crear cuenta",
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  const callbackUrl = safeCallbackPath((await searchParams).callbackUrl)
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <RegisterForm callbackUrl={callbackUrl} />
    </div>
  )
}
