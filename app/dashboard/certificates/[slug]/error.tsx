"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CertificateError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">No pudimos cargar el certificado</h1>
      <p className="mt-2 text-sm text-muted-foreground">Intentá nuevamente o volvé al dashboard.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button onClick={reset}>Reintentar</Button>
        <Button variant="outline" asChild><Link href="/dashboard">Ir al dashboard</Link></Button>
      </div>
    </div>
  )
}
