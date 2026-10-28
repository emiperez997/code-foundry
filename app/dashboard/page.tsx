import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Award, LayoutDashboard, ShieldAlert } from "lucide-react"
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
import { getCourseStatus } from "@/lib/certificates/status"
import { CourseStatus } from "@/components/course-status"

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
      enrollments: {
        some: {
          userId,
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

  const coursesWithProgress = await Promise.all(
    courses.map(async (course) => {
      const totalModules = course.modules.length
      const completedModules = course.modules.filter((module) => module.progress.length > 0).length
      const percentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0
      const nextModule =
        course.modules.find((module) => module.progress.length === 0) ??
        course.modules[course.modules.length - 1]
      const [status, certificate] = await Promise.all([
        getCourseStatus(userId, course.id),
        prisma.certificate.findUnique({
          where: { userId_courseId: { userId, courseId: course.id } },
          select: { id: true, revokedAt: true },
        }),
      ])
      return { ...course, totalModules, completedModules, percentage, nextModule, status, hasCertificate: !!certificate, certificateRevoked: !!certificate?.revokedAt }
    })
  )

  // "Aprobado" lo decide el profesor (entregas), no el avance de lectura.
  const approvedCourses = coursesWithProgress.filter((course) => course.status.eligible || course.hasCertificate)
  const inProgressCourses = coursesWithProgress.filter((course) => !(course.status.eligible || course.hasCertificate))

  function CourseCard({ course, approved }: { course: (typeof coursesWithProgress)[number]; approved: boolean }) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Badge variant="secondary">{course.level}</Badge>
          </div>
          <CardTitle className="text-lg">
            <h3>{course.title}</h3>
          </CardTitle>
          <CardDescription>{course.summary}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div
            role="progressbar"
            aria-label={`Lectura de ${course.title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={course.percentage}
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${course.percentage}%` }} />
          </div>
          <CourseStatus
            status={course.status}
            courseSlug={course.slug}
            hasCertificate={course.hasCertificate}
            certificateRevoked={course.certificateRevoked}
          />
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {approved ? (
            <Button className="min-h-11 w-full justify-between" asChild>
              <Link href={`/dashboard/certificates/${course.slug}`}>
                {course.certificateRevoked ? "Certificado revocado" : course.hasCertificate ? "Ver certificado" : "Obtener certificado"}
                {course.certificateRevoked ? <ShieldAlert aria-hidden="true" className="h-4 w-4" /> : <Award aria-hidden="true" className="h-4 w-4" />}
              </Link>
            </Button>
          ) : course.nextModule && !course.status.reading.done ? (
            <Button className="min-h-11 w-full justify-between" asChild>
              <Link href={`/courses/${course.slug}/modules/${course.nextModule.order}`}>
                {course.percentage === 0 ? "Empezar curso" : "Continuar lectura"}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button className="min-h-11 w-full justify-between" asChild>
              <Link href="/dashboard/assignments">
                Ir a mis entregas
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button className="min-h-11 w-full" variant="secondary" asChild>
            <Link href={`/courses/${course.slug}`}>Ver curso</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <LayoutDashboard aria-hidden="true" className="h-7 w-7" />
            Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Hola, {session.user?.name}. Sigue tus cursos y retoma donde quedaste.
          </p>
        </div>
        <Button variant="outline" className="min-h-11" asChild>
          <Link href="/courses">Explorar cursos</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Todavia no tienes cursos inscritos.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <section aria-labelledby="in-progress-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="in-progress-heading" className="text-xl font-semibold tracking-tight">En progreso</h2>
              <Badge variant="outline">{inProgressCourses.length}</Badge>
            </div>
            {inProgressCourses.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">No tienes cursos en progreso ahora mismo.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {inProgressCourses.map((course) => (
                  <CourseCard key={course.id} course={course} approved={false} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="approved-heading" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 id="approved-heading" className="text-xl font-semibold tracking-tight">Aprobados</h2>
              <Badge variant="outline">{approvedCourses.length}</Badge>
            </div>
            {approvedCourses.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aun no has aprobado ningun curso. Un curso se aprueba cuando un profesor aprueba todas sus entregas obligatorias.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {approvedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} approved />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
