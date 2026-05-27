import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, CheckCircle2, LayoutDashboard } from "lucide-react"
import type { Metadata } from "next"
import { auth } from "@/auth"
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
  title: "Dashboard",
  description: "Tu progreso en los cursos de CodeFoundry.",
}

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    redirect("/login?callbackUrl=/dashboard")
  }

  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      modules: {
        some: {
          progress: {
            some: { userId },
          },
        },
      },
    },
    orderBy: { title: "asc" },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          progress: {
            where: { userId },
            select: { id: true },
          },
        },
      },
    },
  })

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <LayoutDashboard className="h-7 w-7" />
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Hola, {session.user?.name}. Sigue tus cursos y retoma donde quedaste.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/courses">Explorar cursos</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Todavia no tienes cursos en progreso.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => {
            const totalModules = course.modules.length
            const completedModules = course.modules.filter(
              (module) => module.progress.length > 0
            ).length
            const percentage =
              totalModules > 0
                ? Math.round((completedModules / totalModules) * 100)
                : 0

            const nextModule =
              course.modules.find((module) => module.progress.length === 0) ??
              course.modules[course.modules.length - 1]

            return (
              <Card key={course.id} className="flex flex-col">
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant="secondary">{course.level}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {completedModules}/{totalModules} modulos
                    </span>
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.summary}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{percentage}%</span>
                  </div>

                  {percentage === 100 ? (
                    <div className="flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Curso completado
                    </div>
                  ) : null}
                </CardContent>

                <CardFooter>
                  {nextModule ? (
                    <Button className="w-full justify-between" asChild>
                      <Link href={`/courses/${course.slug}/modules/${nextModule.order}`}>
                        {percentage === 100
                          ? "Curso completado"
                          : percentage === 0
                            ? "Empezar curso"
                            : "Continuar curso"}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button className="w-full" variant="secondary" asChild>
                      <Link href={`/courses/${course.slug}`}>Ver curso</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
