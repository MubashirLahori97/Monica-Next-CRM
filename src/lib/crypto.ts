import crypto from 'crypto'

/**
 * Derives or retrieves the 32-byte master encryption key from DATA_ENCRYPTION_KEY or APP_KEY
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.DATA_ENCRYPTION_KEY || process.env.APP_KEY
  if (!envKey) {
    throw new Error('DATA_ENCRYPTION_KEY or APP_KEY is not configured in environment')
  }

  // If base64 encoded 32-byte key
  try {
    const keyBuf = Buffer.from(envKey, 'base64')
    if (keyBuf.length === 32) return keyBuf
  } catch {
    // Fallback to SHA-256 derivation
  }

  // Derive 32-byte key from string
  return crypto.createHash('sha256').update(envKey).digest()
}

/**
 * Encrypts a string using AES-256-GCM (Authenticated Encryption)
 * Format: iv_hex:auth_tag_hex:ciphertext_hex
 */
export function encryptAesGcm(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12) // Recommended 12 bytes for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
  ciphertext += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')

  return `${iv.toString('hex')}:${authTag}:${ciphertext}`
}

/**
 * Decrypts an AES-256-GCM encrypted string and verifies the authentication tag
 */
export function decryptAesGcm(encryptedPayload: string): string {
  const key = getEncryptionKey()
  const parts = encryptedPayload.split(':')

  // Handle AES-256-GCM format (iv:tag:ciphertext)
  if (parts.length === 3) {
    const [ivHex, authTagHex, ciphertextHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  // Backward compatibility fallback for legacy AES-CBC format (iv:ciphertext)
  if (parts.length === 2) {
    const [ivHex, ciphertextHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  throw new Error('Invalid encrypted payload format')
}

/**
 * Secure SHA-256 hashing for tokens and recovery codes
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
