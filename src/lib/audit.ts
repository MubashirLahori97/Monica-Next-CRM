import { db } from '@/lib/db'
import crypto from 'crypto'

export interface AuditLogInput {
  actorUserId?: string | null
  action: string
  targetType: string
  targetId?: string | null
  metadata?: Record<string, unknown> | null
  ip?: string | null
}

/**
 * Creates an audit log entry in the database.
 * Automatically hashes IP addresses to comply with privacy guardrails.
 */
export async function logAuditAction({
  actorUserId,
  action,
  targetType,
  targetId,
  metadata,
  ip,
}: AuditLogInput) {
  try {
    const ipHash = ip ? crypto.createHash('sha256').update(ip).digest('hex') : null
    const metadataJson = metadata ? JSON.stringify(metadata) : null

    return await db.auditLog.create({
      data: {
        actorUserId: actorUserId || null,
        action,
        targetType,
        targetId: targetId || null,
        metadataJson,
        ipHash,
      },
    })
  } catch (error) {
    // In server actions, audit log failure shouldn't crash un-audited processes, but log warning
    console.error('[AuditLog Error]', error)
    return null
  }
}
