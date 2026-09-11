import { NotFoundException } from '@nestjs/common'
import { ILike, Repository } from 'typeorm'
import { StreamingService } from './streaming.service'
import { StreamingEntity } from './entities/streaming.entity'

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}))

describe('StreamingService', () => {
  let service: StreamingService
  let streamingRepo: {
    findOne: jest.Mock
    findAndCount: jest.Mock
    create: jest.Mock
    save: jest.Mock
    remove: jest.Mock
  }

  const streaming: StreamingEntity = {
    id: 'streaming-1',
    title: 'Netflix',
    imgUrl: 'https://example.com/netflix.png',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    streamingRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    }
    service = new StreamingService(streamingRepo as unknown as Repository<StreamingEntity>)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    const dto = {
      title: 'Netflix',
      imgUrl: 'https://example.com/netflix.png',
    }

    it('should create a streaming and return the mapped response', async () => {
      streamingRepo.create.mockReturnValue(streaming)
      streamingRepo.save.mockResolvedValue(streaming)

      const result = await service.create(dto)

      expect(streamingRepo.create).toHaveBeenCalledWith({
        title: dto.title,
        imgUrl: dto.imgUrl,
      })
      expect(streamingRepo.save).toHaveBeenCalledWith(streaming)
      expect(result).toEqual({
        id: streaming.id,
        title: streaming.title,
        imgUrl: streaming.imgUrl,
      })
    })
  })

  describe('findAll', () => {
    it('should paginate with default page and limit', async () => {
      streamingRepo.findAndCount.mockResolvedValue([[streaming], 1])

      const result = await service.findAll({})

      expect(streamingRepo.findAndCount).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 20,
        order: { title: 'ASC' },
      })
      expect(result).toEqual({
        data: [{ id: streaming.id, title: streaming.title, imgUrl: streaming.imgUrl }],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      })
    })

    it('should apply custom page and limit', async () => {
      streamingRepo.findAndCount.mockResolvedValue([[streaming], 25])

      const result = await service.findAll({ page: 2, limit: 10 })

      expect(streamingRepo.findAndCount).toHaveBeenCalledWith({
        where: undefined,
        skip: 10,
        take: 10,
        order: { title: 'ASC' },
      })
      expect(result.page).toBe(2)
      expect(result.limit).toBe(10)
      expect(result.total).toBe(25)
      expect(result.totalPages).toBe(3)
    })

    it('should filter by title when search is provided', async () => {
      streamingRepo.findAndCount.mockResolvedValue([[streaming], 1])

      await service.findAll({ search: '  netflix  ' })

      expect(streamingRepo.findAndCount).toHaveBeenCalledWith({
        where: { title: ILike('%netflix%') },
        skip: 0,
        take: 20,
        order: { title: 'ASC' },
      })
    })

    it('should ignore blank search', async () => {
      streamingRepo.findAndCount.mockResolvedValue([[], 0])

      const result = await service.findAll({ search: '   ' })

      expect(streamingRepo.findAndCount).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 20,
        order: { title: 'ASC' },
      })
      expect(result).toEqual({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      })
    })
  })

  describe('findOne', () => {
    it('should return a mapped streaming', async () => {
      streamingRepo.findOne.mockResolvedValue(streaming)

      const result = await service.findOne(streaming.id)

      expect(streamingRepo.findOne).toHaveBeenCalledWith({ where: { id: streaming.id } })
      expect(result).toEqual({
        id: streaming.id,
        title: streaming.title,
        imgUrl: streaming.imgUrl,
      })
    })

    it('should throw NotFoundException when the streaming does not exist', async () => {
      streamingRepo.findOne.mockResolvedValue(null)

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update the streaming fields', async () => {
      streamingRepo.findOne.mockResolvedValue({ ...streaming })
      streamingRepo.save.mockResolvedValue({ ...streaming, title: 'Prime Video' })

      const result = await service.update(streaming.id, { title: 'Prime Video' })

      expect(streamingRepo.save).toHaveBeenCalledWith(expect.objectContaining({ title: 'Prime Video' }))
      expect(result.title).toBe('Prime Video')
    })

    it('should throw NotFoundException when the streaming does not exist', async () => {
      streamingRepo.findOne.mockResolvedValue(null)

      await expect(service.update('missing', { title: 'Prime Video' })).rejects.toBeInstanceOf(NotFoundException)
      expect(streamingRepo.save).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should remove the streaming', async () => {
      streamingRepo.findOne.mockResolvedValue(streaming)
      streamingRepo.remove.mockResolvedValue(streaming)

      await service.remove(streaming.id)

      expect(streamingRepo.remove).toHaveBeenCalledWith(streaming)
    })

    it('should throw NotFoundException when the streaming does not exist', async () => {
      streamingRepo.findOne.mockResolvedValue(null)

      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException)
      expect(streamingRepo.remove).not.toHaveBeenCalled()
    })
  })
})
