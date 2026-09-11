import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { UserEntity } from './entities/user.entity'
import { InjectRepository } from '@nestjs/typeorm'
import { CreateUserWithPasswordDto, UpdateUserDto, UserResponseDto } from './dto'
import { hash } from 'bcryptjs'
import { UserRole } from './enum/user-role.enum'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async registerUserWithPassword(dto: CreateUserWithPasswordDto): Promise<UserResponseDto> {
    await this.assertEmailIsUnique(dto.email)
    const user = await this.userRepo.save(
      this.userRepo.create({
        name: dto.name,
        email: dto.email,
        password: await hash(dto.password, 10),
      }),
    )
    return this.toResponse(user)
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.userRepo.find({ order: { name: 'ASC' } })
    return users.map(user => this.toResponse(user))
  }

  async findOne(id: string): Promise<UserResponseDto> {
    return this.toResponse(await this.findEntityOrFail(id))
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findEntityOrFail(id)
    if (dto.email && dto.email !== user.email) {
      await this.assertEmailIsUnique(dto.email)
    }
    if (dto.name !== undefined) {
      user.name = dto.name
    }
    if (dto.email !== undefined) {
      user.email = dto.email
    }
    return this.toResponse(await this.userRepo.save(user))
  }

  async promoteToAdmin(id: string): Promise<UserResponseDto> {
    const user = await this.findEntityOrFail(id)
    user.role = UserRole.ADMIN
    return this.toResponse(await this.userRepo.save(user))
  }

  async remove(id: string): Promise<void> {
    const user = await this.findEntityOrFail(id)
    await this.userRepo.remove(user)
  }

  private async assertEmailIsUnique(email: string): Promise<void> {
    const existing = await this.userRepo.findOne({ where: { email } })
    if (existing) {
      throw new ConflictException('User already exists')
    }
  }

  private async findEntityOrFail(id: string): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  private toResponse(user: UserEntity): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }
  }
}
