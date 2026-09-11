import { Module } from '@nestjs/common'
import { AuthService } from './services/auth.service'
import { AuthController } from './auth.controller'
import { PasswordResetService } from './services/password-reset.service'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule } from '@nestjs/config'
import type { ConfigType } from '@nestjs/config'
import { UserEntity } from '@/user/entities/user.entity'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthGuard } from './guards/auth.guard'
import { RequiredRulesGuard } from './guards/required-rules.guard'
import { TokenEntity } from './entities/token.entity'
import { jwtConfig } from './jwt.config'
import { EmailModule } from '@/email/email.module'

@Module({
  imports: [
    EmailModule,
    TypeOrmModule.forFeature([UserEntity, TokenEntity]),
    ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig] }),
    JwtModule.registerAsync({
      global: true,
      inject: [jwtConfig.KEY],
      useFactory: (jwt: ConfigType<typeof jwtConfig>) => ({
        secret: jwt.secret,
        signOptions: {
          algorithm: 'HS256',
          expiresIn: jwt.ttl,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordResetService, AuthGuard, RequiredRulesGuard],
  exports: [AuthGuard, RequiredRulesGuard, TypeOrmModule],
})
export class AuthModule {}
