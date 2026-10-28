import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/app/generated/prisma/client"
import { computeCourseStatus, type CourseStatus } from "./eligibility"

type Db = Pick<Prisma.TransactionClient, "module" | "assignment" | "progress" | "submission">

/** Estado de lectura y de aprobación de un alumno en un curso (lee solo; no emite). */
export async function getCourseStatus(userId: string, courseId: string, db: Db = prisma): Promise<CourseStatus> {
  const [modules, assignments, progress, approved] = await Promise.all([
    db.module.findMany({ where: { courseId }, select: { id: true } }),
    db.assignment.findMany({ where: { courseId, required: true }, select: { id: true } }),
    db.progress.findMany({ where: { userId, module: { courseId } }, select: { moduleId: true } }),
    db.submission.findMany({ where: { studentId: userId, status: "APPROVED", assignment: { courseId } }, select: { assignmentId: true } }),
  ])
  return computeCourseStatus({
    moduleIds: modules.map((m) => m.id),
    completedModuleIds: progress.map((p) => p.moduleId),
    requiredAssignmentIds: assignments.map((a) => a.id),
    approvedAssignmentIds: approved.map((s) => s.assignmentId),
  })
}
