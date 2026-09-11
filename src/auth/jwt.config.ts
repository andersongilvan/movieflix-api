import { registerAs } from '@nestjs/config'

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'secret',
  ttl: Number(process.env.JWT_TTL) || 300,
  refreshTtl: Number(process.env.JWT_REFRESH_TTL) || 604800,
}))
