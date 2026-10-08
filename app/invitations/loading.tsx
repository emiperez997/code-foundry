import { Card, CardContent } from "@/components/ui/card"

export default function Loading() {
  return <div className="container mx-auto max-w-3xl px-4 py-10"><Card><CardContent className="pt-6"><p role="status" className="text-muted-foreground">Cargando…</p></CardContent></Card></div>
}
