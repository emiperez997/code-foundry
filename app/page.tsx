import Link from "next/link"
import { ArrowRight, BookOpen, Code2, Layers } from "lucide-react"
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

export default async function HomePage() {
  const session = await auth()
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: { _count: { select: { modules: true } } },
    orderBy: { title: "asc" },
  })

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="border-b bg-muted/40">
        <div className="container mx-auto max-w-5xl px-4 py-20 md:py-28">
          <div className="flex flex-col items-start gap-6 md:max-w-2xl">
            <Badge variant="secondary" className="text-xs">
              Plataforma de aprendizaje técnico
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Aprende resolviendo{" "}
              <span className="text-primary">problemas reales</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              CodeFoundry te enseña desarrollo de software a través de
              situaciones que enfrentarás en tu trabajo: autenticación,
              diseño de APIs, CI/CD, bases de datos y arquitectura frontend.
            </p>
            <div className="flex gap-3">
              <Button size="lg" asChild>
                <Link href="/courses">
                  Ver cursos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              {!session && (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/register">Crear cuenta gratis</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b">
        <div className="container mx-auto max-w-5xl px-4 py-14">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Code2 className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Código real, no ejercicios</h3>
              <p className="text-sm text-muted-foreground">
                Cada módulo simula un problema que encontrarás en producción,
                con contexto y restricciones reales.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Layers className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Cursos orientados al trabajo</h3>
              <p className="text-sm text-muted-foreground">
                Diseñados para juniors que quieren crecer y seniors que quieren
                consolidar criterio técnico.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Progreso a tu ritmo</h3>
              <p className="text-sm text-muted-foreground">
                Marca módulos como completados y retoma donde lo dejaste desde
                tu dashboard personal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      <section>
        <div className="container mx-auto max-w-5xl px-4 py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Cursos disponibles
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {courses.length} cursos · problemas del mundo real
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/courses">Ver todos</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.slug}
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
      </section>
    </div>
  )
}
