import { UserEntity } from '@/user/entities/user.entity'
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'

import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { compareSync } from 'bcryptjs'
import { AuthUserResponseDto, AuthUserWithPasswordDto, RefreshTokenDto } from '../dto'
import { jwtConfig } from '../jwt.config'
import type { ConfigType } from '@nestjs/config'

type TokenKind = 'access' | 'refresh'

type AuthJwtPayload = {
  sub: string
  type: TokenKind
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwt: ConfigType<typeof jwtConfig>,
  ) {}

  async authUserWithPassword(dto: AuthUserWithPasswordDto): Promise<AuthUserResponseDto> {
    const { email, password } = dto

    const user = await this.userRepo.findOne({ where: { email } })
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const passwordMatch = compareSync(password, user.password)
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return this.buildAuthResponse(user)
  }

  async refreshToken(dto: RefreshTokenDto): Promise<AuthUserResponseDto> {
    const payload = this.verifyRefreshToken(dto.refreshToken)
    const user = await this.findUserFromPayload(payload)
    return this.buildAuthResponse(user)
  }

  private verifyRefreshToken(refreshToken: string): AuthJwtPayload {
    try {
      const payload = this.jwtService.verify<AuthJwtPayload>(refreshToken, {
        algorithms: ['HS256'],
      })
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token')
      }
      return payload
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      throw new UnauthorizedException('Invalid token', { cause: error })
    }
  }

  private async findUserFromPayload(payload: AuthJwtPayload): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } })
    if (!user) {
      throw new UnauthorizedException('User not authenticated')
    }
    return user
  }

  private buildAuthResponse(user: UserEntity): AuthUserResponseDto {
    const { accessToken, refreshToken } = this.generateTokens(user)
    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    }
  }

  private generateTokens(user: UserEntity): { accessToken: string; refreshToken: string } {
    const accessToken = this.signToken(user.id, 'access')
    const refreshToken = this.signToken(user.id, 'refresh')
    return { accessToken, refreshToken }
  }

  private signToken(userId: string, type: TokenKind): string {
    const payload: AuthJwtPayload = { sub: userId, type }
    if (type === 'refresh') {
      return this.jwtService.sign(payload, {
        algorithm: 'HS256',
        expiresIn: this.jwt.refreshTtl,
      })
    }
    return this.jwtService.sign(payload, { algorithm: 'HS256' })
  }
}
