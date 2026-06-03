"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { markModuleCompleted, markModulePending } from "@/lib/actions/progress";
import { Button } from "@/components/ui/button";

type Props = {
  moduleId: string;
  slug: string;
  order: number;
  isCompleted: boolean;
};

type ProgressActionState = {
  error?: string;
};

const initialState: ProgressActionState = {};

function SubmitButton({ isCompleted }: { isCompleted: boolean }) {
  const { pending } = useFormStatus();

  if (isCompleted) {
    return (
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={pending}
        aria-label="Marcar modulo como pendiente"
      >
        {pending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-700" />
        )}
        {pending ? "Actualizando" : "Marcar pendiente"}
      </Button>
    );
  }

  return (
    <Button
      type="submit"
      size="sm"
      disabled={pending}
      aria-label="Marcar modulo como completado"
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Circle className="mr-2 h-4 w-4 text-emerald-700" />
      )}
      {pending ? "Guardando" : "Marcar completado"}
    </Button>
  );
}

export function ModuleProgressForm({
  moduleId,
  slug,
  order,
  isCompleted,
}: Props) {
  const action = isCompleted ? markModulePending : markModuleCompleted;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="order" value={String(order)} />

      <SubmitButton isCompleted={isCompleted} />

      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
