import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StreamingService } from './streaming.service'
import { StreamingController } from './streaming.controller'
import { StreamingEntity } from './entities/streaming.entity'
import { AuthModule } from '@/auth/auth.module'

@Module({
  imports: [TypeOrmModule.forFeature([StreamingEntity]), AuthModule],
  controllers: [StreamingController],
  providers: [StreamingService],
})
export class StreamingModule {}
