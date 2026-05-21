import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Cursos",
  description: "Explora todos los cursos disponibles en CodeFoundry.",
}

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    include: { _count: { select: { modules: true } } },
    orderBy: { title: "asc" },
  })

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Cursos</h1>
        <p className="mt-2 text-muted-foreground">
          {courses.length} cursos disponibles · problemas del mundo real
        </p>
      </div>

      {/* Empty state */}
      {courses.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No hay cursos disponibles aún.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ejecuta <code className="font-mono">pnpm prisma db seed</code> para
            cargar los cursos.
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="flex flex-col transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="outline" className="text-xs font-normal">
                  {course.level}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {course._count.modules} módulos
                </span>
              </div>
              <CardTitle className="text-base leading-snug">
                {course.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <CardDescription className="line-clamp-3 text-sm">
                {course.summary}
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between"
                asChild
              >
                <Link href={`/courses/${course.slug}`}>
                  Ver curso
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
