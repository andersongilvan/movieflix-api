import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('streamings')
export class StreamingEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ nullable: false, type: 'varchar', length: 255 })
  title!: string

  @Column({ name: 'img_url', nullable: false, type: 'varchar', length: 255 })
  imgUrl!: string
}
