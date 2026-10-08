"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function WorkflowErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <div className="container mx-auto max-w-xl px-4 py-10"><Card><CardHeader><CardTitle>No pudimos cargar esta sección</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-muted-foreground">Intentá nuevamente o volvé al inicio.</p><div className="flex gap-3"><Button onClick={reset}>Reintentar</Button><Button variant="outline" asChild><Link href="/">Ir al inicio</Link></Button></div></CardContent></Card></div>
}
