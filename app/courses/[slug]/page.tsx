import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const course = await prisma.course.findUnique({ where: { slug } })
  if (!course) return {}
  return { title: course.title, description: course.summary }
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params

  const course = await prisma.course.findUnique({
    where: { slug },
    include: { modules: { orderBy: { order: "asc" } } },
  })

  if (!course) notFound()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      {/* Back */}
      <Button variant="ghost" size="sm" className="-ml-2 mb-6" asChild>
        <Link href="/courses">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Todos los cursos
        </Link>
      </Button>

      {/* Course header */}
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="secondary">{course.level}</Badge>
          <span className="text-sm text-muted-foreground">
            {course.modules.length} módulos
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
        <p className="mt-3 text-base text-muted-foreground">{course.summary}</p>
      </div>

      <Separator className="mb-8" />

      {/* Module list */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="h-4 w-4" />
          Módulos
        </h2>

        <ol className="flex flex-col gap-2">
          {course.modules.map((mod) => (
            <li key={mod.id}>
              <Link
                href={`/courses/${course.slug}/modules/${mod.order}`}
                className="group flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium text-muted-foreground group-hover:border-primary group-hover:text-primary">
                  {mod.order}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-snug">{mod.title}</p>
                  {mod.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {mod.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {/* Start CTA */}
      <div className="mt-8 flex justify-end">
        <Button asChild>
          <Link href={`/courses/${course.slug}/modules/1`}>
            Empezar curso
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
