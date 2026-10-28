"use client"

import { useActionState } from "react"
import { Award, Loader2 } from "lucide-react"
import { requestCertificate, type CertificateActionState } from "@/lib/actions/certificate"
import { Button } from "@/components/ui/button"

const initial: CertificateActionState = {}

export function CertificateRequestForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(requestCertificate, initial)
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <Button type="submit" disabled={pending} className="min-h-11">
        {pending ? <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : <Award aria-hidden="true" className="mr-2 h-4 w-4" />}
        {pending ? "Emitiendo" : "Obtener certificado"}
      </Button>
      <p role="alert" aria-live="polite" className="text-sm text-destructive">{state.error}</p>
    </form>
  )
}
