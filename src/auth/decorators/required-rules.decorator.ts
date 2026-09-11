import { UserRole } from '@/user/enum/user-role.enum'
import { SetMetadata } from '@nestjs/common'

export const REQUIRED_ROLES_KEY = 'requiredRoles'

export const RequiredRules = (...roles: UserRole[]) => SetMetadata(REQUIRED_ROLES_KEY, roles)
