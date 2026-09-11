import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Repository } from 'typeorm'
import { compareSync } from 'bcryptjs'
import { AuthService } from './auth.service'
import { UserEntity } from '@/user/entities/user.entity'
import { UserRole } from '@/user/enum/user-role.enum'

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}))

jest.mock('@nestjs/jwt', () => ({
  JwtService: class JwtService {},
}))

jest.mock('@nestjs/config', () => ({
  registerAs: (namespace: string) => Object.assign(() => ({}), { KEY: `CONFIGURATION(${namespace})` }),
}))

jest.mock('bcryptjs', () => ({
  compareSync: jest.fn(),
}))

const compareSyncMock = compareSync as unknown as jest.MockedFunction<(password: string, encrypted: string) => boolean>

describe('AuthService', () => {
  let service: AuthService
  let userRepo: {
    findOne: jest.Mock
  }
  let jwtService: {
    sign: jest.Mock
    verify: jest.Mock
  }

  const jwt = {
    secret: 'secret',
    ttl: 300,
    refreshTtl: 604800,
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

  beforeEach(() => {
    jest.clearAllMocks()
    userRepo = { findOne: jest.fn() }
    jwtService = {
      sign: jest.fn((payload: { type: string }) => (payload.type === 'refresh' ? 'refresh.jwt' : 'access.jwt')),
      verify: jest.fn(),
    }
    compareSyncMock.mockReturnValue(true)
    service = new AuthService(userRepo as unknown as Repository<UserEntity>, jwtService as unknown as JwtService, jwt)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('authUserWithPassword', () => {
    const dto = { email: 'ada@example.com', password: 'secret123' }

    it('should authenticate and return access and refresh tokens', async () => {
      userRepo.findOne.mockResolvedValue(user)

      const result = await service.authUserWithPassword(dto)

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: dto.email } })
      expect(compareSyncMock).toHaveBeenCalledWith(dto.password, user.password)
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id, type: 'access' }, { algorithm: 'HS256' })
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: user.id, type: 'refresh' },
        { algorithm: 'HS256', expiresIn: jwt.refreshTtl },
      )
      expect(result).toEqual({
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        accessToken: 'access.jwt',
        refreshToken: 'refresh.jwt',
      })
    })

    it('should throw UnauthorizedException when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null)

      await expect(service.authUserWithPassword(dto)).rejects.toBeInstanceOf(UnauthorizedException)
      expect(compareSyncMock).not.toHaveBeenCalled()
      expect(jwtService.sign).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when the password does not match', async () => {
      userRepo.findOne.mockResolvedValue(user)
      compareSyncMock.mockReturnValue(false)

      await expect(service.authUserWithPassword(dto)).rejects.toBeInstanceOf(UnauthorizedException)
      expect(jwtService.sign).not.toHaveBeenCalled()
    })
  })

  describe('refreshToken', () => {
    it('should issue a new token pair from a valid refresh token', async () => {
      jwtService.verify.mockReturnValue({ sub: user.id, type: 'refresh' })
      userRepo.findOne.mockResolvedValue(user)

      const result = await service.refreshToken({ refreshToken: 'refresh.jwt' })

      expect(jwtService.verify).toHaveBeenCalledWith('refresh.jwt', { algorithms: ['HS256'] })
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: user.id } })
      expect(result.accessToken).toBe('access.jwt')
      expect(result.refreshToken).toBe('refresh.jwt')
    })

    it('should reject an access token used as refresh', async () => {
      jwtService.verify.mockReturnValue({ sub: user.id, type: 'access' })

      await expect(service.refreshToken({ refreshToken: 'access.jwt' })).rejects.toBeInstanceOf(UnauthorizedException)
      expect(userRepo.findOne).not.toHaveBeenCalled()
    })

    it('should throw UnauthorizedException when verify fails', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired')
      })

      await expect(service.refreshToken({ refreshToken: 'bad.jwt' })).rejects.toBeInstanceOf(UnauthorizedException)
    })

    it('should throw UnauthorizedException when the user no longer exists', async () => {
      jwtService.verify.mockReturnValue({ sub: user.id, type: 'refresh' })
      userRepo.findOne.mockResolvedValue(null)

      await expect(service.refreshToken({ refreshToken: 'refresh.jwt' })).rejects.toBeInstanceOf(UnauthorizedException)
    })
  })
})
