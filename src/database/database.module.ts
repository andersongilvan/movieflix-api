import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import type { ConfigType } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { databaseConfig } from './database.config'

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (database: ConfigType<typeof databaseConfig>) => ({
        ...database,
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
