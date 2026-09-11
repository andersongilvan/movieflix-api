import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { UserModule } from './user/user.module'
import { AuthModule } from './auth/auth.module'
import { MovieModule } from './movie/movie.module'
import { CategoryModule } from './category/category.module'
import { StreamingModule } from './streaming/streaming.module'
import { jwtConfig } from './auth/jwt.config'
import { databaseConfig } from './database/database.config'
import { EmailModule } from './email/email.module'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { APP_GUARD } from '@nestjs/core'

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60, blockDuration: 5000 }]),
    ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig, databaseConfig] }),
    DatabaseModule,
    UserModule,
    AuthModule,
    MovieModule,
    CategoryModule,
    StreamingModule,
    EmailModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
