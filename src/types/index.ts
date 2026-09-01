/**
 * Shared Domain & Application Types
 */

export type AccountStatus =
  | 'pending_email_verification'
  | 'pending_approval'
  | 'active'
  | 'rejected'
  | 'suspended'

export interface SessionUser {
  id: string
  name: string | null
  email: string
  status: string
  roleId: string | null
  twoFactorEnabled: boolean
  role?: {
    id: string
    name: string
    rank: number
  } | null
}

export interface CustomSession {
  user: SessionUser
  twoFactorPending?: boolean
}

export interface VaultInfo {
  id: string
  name: string
  description?: string | null
}
