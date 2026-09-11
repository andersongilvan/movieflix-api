import { BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { IsNull, MoreThan, Repository } from 'typeorm'
import { createHash, randomBytes } from 'node:crypto'
import { hash } from 'bcryptjs'
import { PasswordResetService } from './password-reset.service'
import { UserEntity } from '@/user/entities/user.entity'
import { TokenEntity } from '../entities/token.entity'
import { TokenType } from '../enum/token-type.enum'
import { UserRole } from '@/user/enum/user-role.enum'
import { EmailService } from '@/email/email.service'

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}))

jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
  registerAs: (namespace: string) => Object.assign(() => ({}), { KEY: `CONFIGURATION(${namespace})` }),
}))

jest.mock('@/email/email.service', () => ({
  EmailService: class EmailService {},
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

jest.mock('node:crypto', () => ({
  createHash: jest.fn(),
  randomBytes: jest.fn(),
}))

const hashMock = hash as unknown as jest.MockedFunction<(password: string, salt: number | string) => Promise<string>>
const createHashMock = createHash as unknown as jest.Mock
const randomBytesMock = randomBytes as unknown as jest.Mock

describe('PasswordResetService', () => {
  let service: PasswordResetService
  let userRepo: {
    findOne: jest.Mock
    update: jest.Mock
  }
  let tokenRepo: {
    update: jest.Mock
    save: jest.Mock
    create: jest.Mock
    findOne: jest.Mock
  }
  let configService: {
    get: jest.Mock
  }
  let emailService: {
    sendEmail: jest.Mock
  }

  const user: UserEntity = {
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'hashed-password',
    role: UserRole.USER,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }

  const rawToken = 'raw-token'
  const tokenHash = 'sha256-hash'
  const now = 1_700_000_000_000
  const RESET_TOKEN_TTL_MS = 1000 * 60 * 30

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(now)

    userRepo = { findOne: jest.fn(), update: jest.fn() }
    tokenRepo = {
      update: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
    }
    configService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    }
    emailService = { sendEmail: jest.fn().mockResolvedValue(undefined) }

    randomBytesMock.mockReturnValue({ toString: () => rawToken })
    createHashMock.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue(tokenHash),
    })
    hashMock.mockResolvedValue('new-hashed-password')

    service = new PasswordResetService(
      userRepo as unknown as Repository<UserEntity>,
      tokenRepo as unknown as Repository<TokenEntity>,
      configService as unknown as ConfigService,
      emailService as unknown as EmailService,
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('requestReset', () => {
    it('should return silently when the email is unknown', async () => {
      userRepo.findOne.mockResolvedValue(null)

      await service.requestReset(user.email)

      expect(tokenRepo.update).not.toHaveBeenCalled()
      expect(tokenRepo.save).not.toHaveBeenCalled()
      expect(emailService.sendEmail).not.toHaveBeenCalled()
    })

    it('should invalidate pending tokens, store a hash and send the reset email', async () => {
      const created = { tokenHash, type: TokenType.PASSWORD_RESET, userId: user.id }
      userRepo.findOne.mockResolvedValue(user)
      tokenRepo.create.mockReturnValue(created)
      tokenRepo.save.mockResolvedValue(created)

      await service.requestReset(user.email)

      expect(tokenRepo.update).toHaveBeenCalledWith(
        { userId: user.id, type: TokenType.PASSWORD_RESET, usedAt: IsNull() },
        { usedAt: expect.any(Date) },
      )
      expect(createHashMock).toHaveBeenCalledWith('sha256')
      expect(tokenRepo.create).toHaveBeenCalledWith({
        tokenHash,
        type: TokenType.PASSWORD_RESET,
        userId: user.id,
        expiresAt: new Date(now + RESET_TOKEN_TTL_MS),
      })
      expect(configService.get).toHaveBeenCalledWith('FRONTEND_URL', 'http://localhost:3000')
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        user.email,
        'Password reset',
        `http://localhost:3000/auth/reset-password?token=${rawToken}`,
      )
    })
  })

  describe('resetPassword', () => {
    const tokenRecord: TokenEntity = {
      id: 'token-1',
      tokenHash,
      type: TokenType.PASSWORD_RESET,
      user: user,
      userId: user.id,
      expiresAt: new Date(now + RESET_TOKEN_TTL_MS),
      usedAt: null,
      createdAt: new Date(now),
    }

    it('should update the password and mark the token as used', async () => {
      tokenRepo.findOne.mockResolvedValue({ ...tokenRecord })
      userRepo.update.mockResolvedValue({ affected: 1 })
      tokenRepo.save.mockResolvedValue({ ...tokenRecord, usedAt: new Date(now) })

      await service.resetPassword(rawToken, 'new-password')

      expect(tokenRepo.findOne).toHaveBeenCalledWith({
        where: {
          tokenHash,
          type: TokenType.PASSWORD_RESET,
          usedAt: IsNull(),
          expiresAt: MoreThan(new Date(now)),
        },
      })
      expect(hashMock).toHaveBeenCalledWith('new-password', 10)
      expect(userRepo.update).toHaveBeenCalledWith(user.id, { password: 'new-hashed-password' })
      expect(tokenRepo.save).toHaveBeenCalledWith(expect.objectContaining({ usedAt: expect.any(Date) }))
    })

    it('should throw BadRequestException when the token is invalid or expired', async () => {
      tokenRepo.findOne.mockResolvedValue(null)

      await expect(service.resetPassword('bad-token', 'new-password')).rejects.toBeInstanceOf(BadRequestException)
      expect(userRepo.update).not.toHaveBeenCalled()
      expect(tokenRepo.save).not.toHaveBeenCalled()
    })
  })
})
