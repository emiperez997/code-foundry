import Link from "next/link"
import { Code2, LogOut } from "lucide-react"
import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"

export async function Navbar() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Code2 className="h-5 w-5" />
          <span>CodeFoundry</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/courses">Cursos</Link>
          </Button>

          {session?.user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session.user.name}
              </span>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
              >
                <Button variant="ghost" size="sm" type="submit">
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
