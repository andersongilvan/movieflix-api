import { UserPayload } from '@/@types'
import { UserEntity } from '@/user/entities/user.entity'
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { Request } from 'express'
import { Repository } from 'typeorm'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest()

    const token = this.extractTokenFromHeader(request)

    try {
      const payload = this.jwtService.verify<UserPayload>(token, { algorithms: ['HS256'] })
      if (payload.type === 'refresh') {
        throw new UnauthorizedException('Invalid token')
      }
      const user = await this.userRepo.findOne({ where: { id: payload.sub } })
      if (!user) {
        throw new UnauthorizedException('User not authenticated')
      }
      request.user = {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
      return true
    } catch (error) {
      throw new UnauthorizedException('Invalid token', { cause: error })
    }
  }

  private extractTokenFromHeader(request: Request): string {
    const token = request.headers.authorization?.split(' ')[1]
    if (!token) throw new UnauthorizedException('Token is required')
    return token
  }
}
