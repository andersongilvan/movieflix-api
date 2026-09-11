import { CategoryEntity } from '@/category/entities/category.entity'
import { StreamingEntity } from '@/streaming/entities/streaming.entity'
import { AuthModule } from '@/auth/auth.module'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MovieService } from './movie.service'
import { MovieController } from './movie.controller'
import { MovieEntity } from './entities/movie.entity'

@Module({
  imports: [TypeOrmModule.forFeature([MovieEntity, CategoryEntity, StreamingEntity]), AuthModule],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
