import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react"
import type { Metadata } from "next"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ModuleProgressForm } from "@/components/module-progress-form"

type Props = { params: Promise<{ slug: string; order: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, order } = await params
  const orderNum = parseInt(order, 10)
  if (isNaN(orderNum)) return {}

  const course = await prisma.course.findUnique({ where: { slug } })
  if (!course) return {}

  const mod = await prisma.module.findUnique({
    where: { courseId_order: { courseId: course.id, order: orderNum } },
  })
  if (!mod) return {}

  return {
    title: `${mod.title} — ${course.title}`,
  }
}

export default async function ModulePage({ params }: Props) {
  const { slug, order } = await params
  const orderNum = parseInt(order, 10)
  if (isNaN(orderNum)) notFound()

  const session = await auth()
  const userId = session?.user?.id

  const course = await prisma.course.findUnique({
    where: { slug },
    include: { modules: { orderBy: { order: "asc" } } },
  })
  if (!course) notFound()

  const mod = course.modules.find((m) => m.order === orderNum)
  if (!mod) notFound()

  const progress = userId
    ? await prisma.progress.findUnique({
        where: { userId_moduleId: { userId, moduleId: mod.id } },
      })
    : null
  const isCompleted = !!progress

  const totalModules = course.modules.length
  const prevModule = course.modules.find((m) => m.order === orderNum - 1)
  const nextModule = course.modules.find((m) => m.order === orderNum + 1)

  return (
    <div className="container mx-auto max-w-3xl px-4 py-10">
      {/* Back to course */}
      <Button variant="ghost" size="sm" className="-ml-2 mb-6" asChild>
        <Link href={`/courses/${slug}`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {course.title}
        </Link>
      </Button>

      {/* Module header */}
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            Módulo {mod.order} / {totalModules}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {course.level}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{mod.title}</h1>
      </div>

      <Separator className="mb-8" />

      {/* Module content */}
      <div className="prose prose-neutral max-w-none">
        <div className="rounded-lg border bg-muted/30 p-6">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <p className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Contexto del módulo
              </p>
              <p className="text-base leading-relaxed">{mod.description}</p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      <div className="mb-8 flex items-center justify-between rounded-lg border bg-muted/30 p-4">
        <div>
          <p className="text-sm font-medium">Estado del módulo</p>
          <p className="text-xs text-muted-foreground">
            {isCompleted
              ? "Completado. Puedes marcarlo pendiente si quieres repasarlo."
              : "Cuando lo termines, marca este módulo como completado."}
          </p>
        </div>
        <ModuleProgressForm
          moduleId={mod.id}
          slug={slug}
          order={mod.order}
          isCompleted={isCompleted}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div>
          {prevModule ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/courses/${slug}/modules/${prevModule.order}`}>
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Módulo anterior
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/courses/${slug}`}>
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                Volver al curso
              </Link>
            </Button>
          )}
        </div>

        <span className="text-xs text-muted-foreground">
          {mod.order} de {totalModules}
        </span>

        <div>
          {nextModule ? (
            <Button size="sm" asChild>
              <Link href={`/courses/${slug}/modules/${nextModule.order}`}>
                Siguiente módulo
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/courses/${slug}`}>
                Finalizar curso
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Module index sidebar hint */}
      <div className="mt-10">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Módulos del curso
        </p>
        <ol className="flex flex-col gap-1">
          {course.modules.map((m) => (
            <li key={m.id}>
              <Link
                href={`/courses/${slug}/modules/${m.order}`}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${
                  m.order === orderNum
                    ? "bg-muted font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <span className="w-4 text-right text-xs tabular-nums">
                  {m.order}
                </span>
                <span className="truncate">{m.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
