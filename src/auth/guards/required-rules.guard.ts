import { UserPayload } from '@/@types'
import { UserRole } from '@/user/enum/user-role.enum'
import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'
import { REQUIRED_ROLES_KEY } from '../decorators/required-rules.decorator'

@Injectable()
export class RequiredRulesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.getRequiredRoles(context)
    if (!this.hasRoleRestriction(requiredRoles)) {
      return true
    }

    const user = this.getAuthenticatedUser(context)
    if (!this.userHasRequiredRole(user, requiredRoles)) {
      throw new ForbiddenException('Insufficient permissions')
    }

    return true
  }

  private getRequiredRoles(context: ExecutionContext): UserRole[] {
    return (
      this.reflector.getAllAndOverride<UserRole[]>(REQUIRED_ROLES_KEY, [context.getHandler(), context.getClass()]) ?? []
    )
  }

  private hasRoleRestriction(requiredRoles: UserRole[]): boolean {
    return requiredRoles.length > 0
  }

  private getAuthenticatedUser(context: ExecutionContext): UserPayload {
    const request: Request = context.switchToHttp().getRequest()
    const user = request.user
    if (!user) {
      throw new UnauthorizedException('User not authenticated')
    }
    return user
  }

  private userHasRequiredRole(user: UserPayload, requiredRoles: UserRole[]): boolean {
    return user.role === UserRole.ADMIN || requiredRoles.includes(user.role as UserRole)
  }
}
