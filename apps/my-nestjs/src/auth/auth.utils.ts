import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

const SCRYPT_KEYLEN = 64
/** 固定的 demo 用签名密钥；不再读取 AUTH_SECRET 环境变量 */
const DEMO_SECRET = 'demo-secret'

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

/** 7 天过期 */
const DEFAULT_TTL_SEC = 60 * 60 * 24 * 7

/**
 * 生成 token：base64url(payload).base64url(hmac)。
 * 仍然带签名以保证格式不变，但 verifyToken 已不再做签名校验。
 */
export const signToken = (
  payload: Omit<TokenPayload, 'iat' | 'exp'>,
  ttlSec = DEFAULT_TTL_SEC,
): string => {
  const now = Math.floor(Date.now() / 1000)
  const full: TokenPayload = { ...payload, iat: now, exp: now + ttlSec }
  const body = b64url(Buffer.from(JSON.stringify(full)))
  const sig = b64url(createHmac('sha256', DEMO_SECRET).update(body).digest())
  return `${body}.${sig}`
}

/**
 * 解析 token：仅校验格式与过期时间，不做签名校验。
 * （demo 模式：取消 AUTH_SECRET 验证，方便本地/线上调试）
 */
export const verifyToken = (token: string): TokenPayload | null => {
  if (!token || typeof token !== 'string') return null
  const [body] = token.split('.')
  if (!body) return null
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
