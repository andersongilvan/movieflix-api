import { CategoryEntity } from '@/category/entities/category.entity'
import { StreamingEntity } from '@/streaming/entities/streaming.entity'
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

@Entity('movies')
export class MovieEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ nullable: false, type: 'varchar', length: 255, unique: true })
  title!: string

  @Column({ nullable: true, type: 'text' })
  description!: string | null

  @Column({ name: 'release_year', nullable: false, type: 'smallint' })
  releaseYear!: number

  @Column({ name: 'duration_in_minutes', nullable: false, type: 'int' })
  durationInMinutes!: number

  @Column({ name: 'img_url', nullable: false, type: 'varchar', length: 255 })
  imgUrl!: string

  @ManyToMany(() => CategoryEntity)
  @JoinTable({
    name: 'movie_categories',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories!: CategoryEntity[]

  @ManyToMany(() => StreamingEntity)
  @JoinTable({
    name: 'movie_streaming_platforms',
    joinColumn: { name: 'movie_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'streaming_platform_id', referencedColumnName: 'id' },
  })
  streamingPlatforms!: StreamingEntity[]
}
