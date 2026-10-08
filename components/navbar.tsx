import Link from "next/link"
import { Code2, LogOut } from "lucide-react"
import { signOut } from "@/auth"
import { currentUser } from "@/lib/auth/permissions"
import { Button } from "@/components/ui/button"

export async function Navbar() {
  const user = await currentUser()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex min-h-14 max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Code2 className="h-5 w-5" />
          <span>CodeFoundry</span>
        </Link>

        <nav className="flex w-full flex-wrap items-center gap-1 sm:w-auto">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/courses">Cursos</Link>
          </Button>

          {user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {user.roles.includes("STUDENT") && <Button variant="ghost" size="sm" asChild><Link href="/dashboard/assignments">Entregas</Link></Button>}
              {user.roles.includes("TEACHER") && <Button variant="ghost" size="sm" asChild><Link href="/teacher">Correcciones</Link></Button>}
              {user.roles.includes("ADMIN") && <Button variant="ghost" size="sm" asChild><Link href="/admin">Administración</Link></Button>}
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name}
              </span>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
              >
                <Button variant="ghost" size="sm" type="submit" aria-label="Cerrar sesión">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </form>
            </>
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">Iniciar sesión</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
