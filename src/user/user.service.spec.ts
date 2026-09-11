import { ConflictException, NotFoundException } from '@nestjs/common'
import { Repository } from 'typeorm'
import { hash } from 'bcryptjs'
import { UserService } from './user.service'
import { UserEntity } from './entities/user.entity'
import { UserRole } from './enum/user-role.enum'

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

const hashMock = hash as unknown as jest.MockedFunction<(password: string, salt: number | string) => Promise<string>>

describe('UserService', () => {
  let service: UserService
  let userRepo: {
    findOne: jest.Mock
    find: jest.Mock
    create: jest.Mock
    save: jest.Mock
    remove: jest.Mock
  }

  const user: UserEntity = {
    id: 'user-1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'hashed-password',
    role: UserRole.USER,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    userRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    }
    hashMock.mockResolvedValue('hashed-password')
    service = new UserService(userRepo as unknown as Repository<UserEntity>)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('registerUserWithPassword', () => {
    const dto = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'secret123',
    }

    it('should create a user and omit the password from the response', async () => {
      userRepo.findOne.mockResolvedValue(null)
      userRepo.create.mockReturnValue(user)
      userRepo.save.mockResolvedValue(user)

      const result = await service.registerUserWithPassword(dto)

      expect(hashMock).toHaveBeenCalledWith('secret123', 10)
      expect(userRepo.create).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
        password: 'hashed-password',
      })
      expect(result).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
      expect(result).not.toHaveProperty('password')
    })

    it('should throw ConflictException when the email is already taken', async () => {
      userRepo.findOne.mockResolvedValue(user)

      await expect(service.registerUserWithPassword(dto)).rejects.toBeInstanceOf(ConflictException)
      expect(userRepo.save).not.toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('should return mapped users without passwords', async () => {
      userRepo.find.mockResolvedValue([user])

      const result = await service.findAll()

      expect(userRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } })
      expect(result).toEqual([{ id: user.id, name: user.name, email: user.email, role: user.role }])
    })
  })

  describe('findOne', () => {
    it('should return a mapped user', async () => {
      userRepo.findOne.mockResolvedValue(user)

      const result = await service.findOne(user.id)

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: user.id } })
      expect(result).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
    })

    it('should throw NotFoundException when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null)

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update the name', async () => {
      userRepo.findOne.mockResolvedValue({ ...user })
      userRepo.save.mockResolvedValue({ ...user, name: 'Ada' })

      const result = await service.update(user.id, { name: 'Ada' })

      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ada' }))
      expect(result.name).toBe('Ada')
    })

    it('should check email uniqueness when the email changes', async () => {
      userRepo.findOne.mockResolvedValueOnce({ ...user }).mockResolvedValueOnce(null)
      userRepo.save.mockResolvedValue({ ...user, email: 'new@example.com' })

      await service.update(user.id, { email: 'new@example.com' })

      expect(userRepo.findOne).toHaveBeenNthCalledWith(2, { where: { email: 'new@example.com' } })
    })

    it('should not check uniqueness when the email stays the same', async () => {
      userRepo.findOne.mockResolvedValue({ ...user })
      userRepo.save.mockResolvedValue(user)

      await service.update(user.id, { email: user.email })

      expect(userRepo.findOne).toHaveBeenCalledTimes(1)
    })

    it('should throw ConflictException when the new email is taken', async () => {
      userRepo.findOne.mockResolvedValueOnce({ ...user }).mockResolvedValueOnce(user)

      await expect(service.update(user.id, { email: 'taken@example.com' })).rejects.toBeInstanceOf(ConflictException)
      expect(userRepo.save).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null)

      await expect(service.update('missing', { name: 'Ada' })).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('promoteToAdmin', () => {
    it('should set the user role to admin', async () => {
      userRepo.findOne.mockResolvedValue({ ...user })
      userRepo.save.mockResolvedValue({ ...user, role: UserRole.ADMIN })

      const result = await service.promoteToAdmin(user.id)

      expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ role: UserRole.ADMIN }))
      expect(result.role).toBe(UserRole.ADMIN)
    })

    it('should throw NotFoundException when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null)

      await expect(service.promoteToAdmin('missing')).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('remove', () => {
    it('should remove the user', async () => {
      userRepo.findOne.mockResolvedValue(user)
      userRepo.remove.mockResolvedValue(user)

      await service.remove(user.id)

      expect(userRepo.remove).toHaveBeenCalledWith(user)
    })

    it('should throw NotFoundException when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null)

      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException)
      expect(userRepo.remove).not.toHaveBeenCalled()
    })
  })
})
