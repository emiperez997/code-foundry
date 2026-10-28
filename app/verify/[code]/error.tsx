"use client"

import { Button } from "@/components/ui/button"

export default function VerifyError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">No pudimos verificar el certificado</h1>
      <p className="mt-2 text-sm text-muted-foreground">Intentá de nuevo en unos instantes.</p>
      <Button className="mt-6" onClick={reset}>Reintentar</Button>
    </div>
  )
}
