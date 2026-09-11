import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { UserRole } from '../enum/user-role.enum'

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ nullable: false, type: 'varchar', length: 255 })
  name!: string

  @Column({ nullable: false, type: 'varchar', length: 255, unique: true })
  email!: string

  @Column({ nullable: false, type: 'varchar', length: 255 })
  password!: string

  @Column({ nullable: false, type: 'varchar', default: UserRole.USER })
  role!: UserRole

  @CreateDateColumn({ nullable: false, type: 'timestamp' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date
}
