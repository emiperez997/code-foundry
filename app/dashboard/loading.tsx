import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-44 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      </div>

      <div className="space-y-10">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-28 animate-pulse rounded bg-muted" />
            <div className="h-6 w-10 animate-pulse rounded bg-muted" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={`in-progress-${index}`} className="flex flex-col">
                <CardHeader className="space-y-3">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-56 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-2 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-9 w-full animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-28 animate-pulse rounded bg-muted" />
            <div className="h-6 w-10 animate-pulse rounded bg-muted" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={`completed-${index}`} className="flex flex-col">
                <CardHeader className="space-y-3">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-56 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-2 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-9 w-full animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
