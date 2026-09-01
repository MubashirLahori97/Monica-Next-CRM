import type { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      status: string
      roleRank: number
      twoFactorEnabled: boolean
    } & DefaultSession["user"]
    twoFactorPending: boolean
  }

  interface User extends DefaultUser {
    status?: string
    roleRank?: number
    twoFactorEnabled?: boolean
  }
}
