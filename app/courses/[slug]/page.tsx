import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react"
import type { Metadata } from "next"
import { auth } from "@/auth"
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
  const session = await auth()
  const userId = session?.user?.id

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          progress: {
            where: { userId: userId ?? "" },
            select: { id: true },
          },
        },
      },
    },
  })

  if (!course) notFound()

  const completedModules = course.modules.filter(
    (module) => module.progress.length > 0
  ).length
  const totalModules = course.modules.length
  const isCourseCompleted = totalModules > 0 && completedModules === totalModules
  const nextModule =
    course.modules.find((module) => module.progress.length === 0) ??
    course.modules[0]

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
            {totalModules} módulos
          </span>
          {userId ? (
            <span className="text-sm text-muted-foreground">
              {completedModules}/{totalModules} completados
            </span>
          ) : null}
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
          {course.modules.map((mod) => {
            const isCompleted = mod.progress.length > 0

            return (
              <li key={mod.id}>
                <Link
                  href={`/courses/${course.slug}/modules/${mod.order}`}
                  className={`group flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                    isCompleted ? "border-emerald-200 bg-emerald-50/40" : ""
                  }`}
                >
                  {isCompleted ? (
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium text-muted-foreground group-hover:border-primary group-hover:text-primary">
                      {mod.order}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium leading-snug">{mod.title}</p>
                      {isCompleted ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-emerald-700"
                        >
                          Completado
                        </Badge>
                      ) : null}
                    </div>
                    {mod.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {mod.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Start CTA */}
      <div className="mt-8 flex justify-end">
        {nextModule ? (
          <Button variant={isCourseCompleted ? "secondary" : "default"} asChild>
            <Link href={`/courses/${course.slug}/modules/${nextModule.order}`}>
              {isCourseCompleted
                ? "Curso completado"
                : completedModules > 0
                  ? "Continuar curso"
                  : "Empezar curso"}
              {isCourseCompleted ? (
                <CheckCircle2 className="ml-1 h-4 w-4" />
              ) : (
                <ArrowRight className="ml-1 h-4 w-4" />
              )}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
