import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { UserEntity } from '@/user/entities/user.entity'
import { TokenType } from '../enum/token-type.enum'

@Entity('tokens')
export class TokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  // Guarda o hash (sha256) do token, nunca o valor cru enviado ao usuário.
  @Index()
  @Column({ name: 'token_hash', nullable: false, type: 'varchar', length: 255 })
  tokenHash!: string

  @Column({ nullable: false, type: 'enum', enum: TokenType })
  type!: TokenType

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserEntity

  @Column({ name: 'user_id', nullable: false, type: 'uuid' })
  userId!: string

  @Column({ name: 'expires_at', nullable: false, type: 'timestamp' })
  expiresAt!: Date

  @Column({ name: 'used_at', nullable: true, type: 'timestamp' })
  usedAt!: Date | null

  @CreateDateColumn({ name: 'created_at', nullable: false, type: 'timestamp' })
  createdAt!: Date
}
