import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

/**
 * Auth config sin dependencias de Node.js (Prisma).
 * Usado en el proxy sin cargar la conexión a la base de datos.
 * La lógica de autorización real vive en auth.ts.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [Credentials({})],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isModuleRoute = nextUrl.pathname.includes("/modules/") || nextUrl.pathname === "/dashboard"

      if (isModuleRoute && !isLoggedIn) {
        const loginUrl = new URL("/login", nextUrl.origin)
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search)
        return Response.redirect(loginUrl)
      }

      return true
    },
  },
}
