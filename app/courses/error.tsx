"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  error: Error
  reset: () => void
}

export default function CoursesError({ error, reset }: Props) {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-lg border border-dashed p-8 text-center">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          No pudimos cargar los cursos
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Intenta nuevamente. Si continua, vuelve al inicio.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={reset}>Reintentar</Button>
          <Button variant="outline" asChild>
            <Link href="/">Ir al inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
