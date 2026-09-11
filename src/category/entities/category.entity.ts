import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ nullable: false, type: 'varchar', length: 255 })
  title!: string
}
