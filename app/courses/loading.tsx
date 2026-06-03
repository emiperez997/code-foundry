import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function CoursesLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader className="space-y-3">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-9 w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
