import { Card, CardContent } from "@/components/ui/card"

export default function CourseDetailLoading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 h-8 w-36 animate-pulse rounded bg-muted" />

      <div className="mb-8 space-y-3">
        <div className="h-5 w-52 animate-pulse rounded bg-muted" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-4">
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-end">
        <div className="h-10 w-40 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
