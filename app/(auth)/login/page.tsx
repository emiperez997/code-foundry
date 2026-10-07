import type { Metadata } from "next"
import { LoginForm } from "@/components/login-form"
import { safeCallbackPath } from "@/lib/auth/validation"

export const metadata: Metadata = {
  title: "Iniciar sesión",
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  const callbackUrl = safeCallbackPath((await searchParams).callbackUrl)
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  )
}
