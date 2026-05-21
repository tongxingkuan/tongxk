import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

const SCRYPT_KEYLEN = 64

/** 把任意 base64 转 base64url（去掉 = 与 +/ 替换） */
const b64url = (buf: Buffer | string) => {
  const s = typeof buf === 'string' ? buf : buf.toString('base64')
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromB64url = (s: string) => {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

/** 使用 scrypt 哈希密码，结果格式：scrypt$<salt-base64>$<hash-base64> */
export const hashPassword = (plain: string): string => {
  const salt = randomBytes(16)
  const hash = scryptSync(plain, salt, SCRYPT_KEYLEN)
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`
}

export const verifyPassword = (plain: string, stored: string): boolean => {
  const parts = stored.split('$')
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false
  const salt = Buffer.from(parts[1], 'base64')
  const expected = Buffer.from(parts[2], 'base64')
  const actual = scryptSync(plain, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export interface TokenPayload {
  sub: string // user id
  username: string
  role: string
  iat: number // issued-at（秒）
  exp: number // 过期（秒）
}

const getSecret = () =>
  process.env.AUTH_SECRET
  ?? process.env.ADMIN_TOKEN
  ?? 'dev-only-insecure-secret'

/** 7 天过期 */
const DEFAULT_TTL_SEC = 60 * 60 * 24 * 7

/**
 * 生成自签 token：base64url(payload).base64url(hmac)。
 * 不依赖 jsonwebtoken；够 demo 用。
 */
export const signToken = (
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  ttlSec = DEFAULT_TTL_SEC,
): string => {
  const now = Math.floor(Date.now() / 1000)
  const full: TokenPayload = { ...payload, iat: now, exp: now + ttlSec }
  const body = b64url(Buffer.from(JSON.stringify(full)))
  const sig = b64url(createHmac('sha256', getSecret()).update(body).digest())
  return `${body}.${sig}`
}

export const verifyToken = (token: string): TokenPayload | null => {
  if (!token || typeof token !== 'string') return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = b64url(
    createHmac('sha256', getSecret()).update(body).digest(),
  )
  if (expected.length !== sig.length) return null
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return null
  try {
    const payload = JSON.parse(
      fromB64url(body).toString('utf8'),
    ) as TokenPayload
    if (Math.floor(Date.now() / 1000) > payload.exp) return null
    return payload
  } catch {
    return null
  }
}
