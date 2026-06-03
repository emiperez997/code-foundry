import { Card, CardContent } from "@/components/ui/card"

export default function ModuleLoading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 h-8 w-64 animate-pulse rounded bg-muted" />

      <div className="mb-8 space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="h-9 w-2/3 animate-pulse rounded bg-muted" />
      </div>

      <Card>
        <CardContent className="space-y-3 p-6">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>

      <div className="my-8 h-16 w-full animate-pulse rounded-lg bg-muted" />

      <div className="flex items-center justify-between">
        <div className="h-9 w-36 animate-pulse rounded bg-muted" />
        <div className="h-4 w-14 animate-pulse rounded bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
