import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { authorizeCredentials } from "@/lib/auth/credentials"
import { authConfig } from "@/auth.config"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: authorizeCredentials,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      const user = typeof token.id === "string" ? await prisma.user.findUnique({ where: { id: token.id }, select: { id: true, isActive: true } }) : null
      session.user.id = user?.isActive ? user.id : ""
      return session
    },
  },
})
