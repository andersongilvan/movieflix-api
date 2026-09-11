import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, MoreThan, Repository } from 'typeorm'
import { createHash, randomBytes } from 'node:crypto'
import { hash } from 'bcryptjs'
import { UserEntity } from '@/user/entities/user.entity'
import { TokenEntity } from '../entities/token.entity'
import { TokenType } from '../enum/token-type.enum'
import { EmailService } from '@/email/email.service'

// Tempo de vida do token de recuperação de senha.
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30 // 30 minutos

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(TokenEntity)
    private readonly tokenRepo: Repository<TokenEntity>,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex')
  }

  async requestReset(email: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email } })
    // Resposta silenciosa: não revelamos se o e-mail tem conta ou não.
    if (!user) {
      return
    }

    // Invalida qualquer token de reset ainda pendente desse usuário.
    await this.tokenRepo.update(
      { userId: user.id, type: TokenType.PASSWORD_RESET, usedAt: IsNull() },
      { usedAt: new Date() },
    )

    const rawToken = randomBytes(32).toString('hex')
    await this.tokenRepo.save(
      this.tokenRepo.create({
        tokenHash: this.hashToken(rawToken),
        type: TokenType.PASSWORD_RESET,
        userId: user.id,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      }),
    )

    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')
    const resetLink = `${frontendUrl}/auth/reset-password?token=${rawToken}`

    await this.emailService.sendEmail(email, 'Password reset', resetLink)
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const record = await this.tokenRepo.findOne({
      where: {
        tokenHash: this.hashToken(rawToken),
        type: TokenType.PASSWORD_RESET,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    })
    if (!record) {
      throw new BadRequestException('Invalid or expired token')
    }

    await this.userRepo.update(record.userId, { password: await hash(newPassword, 10) })

    record.usedAt = new Date()
    await this.tokenRepo.save(record)
  }
}
