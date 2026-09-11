import { registerAs } from '@nestjs/config'

export const emailConfig = registerAs('email', () => {
  const port = Number(process.env.EMAIL_PORT) || 587
  return {
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
  }
})
