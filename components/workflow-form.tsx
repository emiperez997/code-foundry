"use client"

import { useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { ActionState } from "@/lib/actions/evaluation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

export function WorkflowForm({ action, children, label, reloadOnSuccess = false }: { action: (state: ActionState, form: FormData) => Promise<ActionState>; children?: ReactNode; label: string; reloadOnSuccess?: boolean }) {
  const [state, setState] = useState<ActionState>({})
  const [pending, setPending] = useState(false)
  const ready = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
  const router = useRouter()

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || !ready) return
    // Capturar los campos antes de deshabilitar el formulario.
    const form = new FormData(event.currentTarget)
    setPending(true)
    try {
      const result = await action(state, form)
      setState(result)
      if (result.message) {
        if (reloadOnSuccess) window.location.reload()
        else router.refresh()
      }
    } catch {
      setState({ error: "No se pudo completar la operación. Intentá nuevamente." })
    } finally {
      setPending(false)
    }
  }

  return <form onSubmit={submit} aria-busy={pending || !ready} className="space-y-4">
    <fieldset disabled={pending || !ready} className="space-y-4">{children}
      <Button type="submit" disabled={pending || !ready}>{!ready ? "Cargando…" : pending ? "Guardando…" : label}</Button>
    </fieldset>
    {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
    {state.message && <p role="status" className="text-sm text-muted-foreground">{state.message}</p>}
    {state.url && <div className="space-y-2"><Input aria-label="Enlace de invitación" readOnly value={state.url} /><Button variant="outline" asChild><a href={state.url}>Abrir invitación</a></Button></div>}
  </form>
}
