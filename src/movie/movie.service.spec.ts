import { ConflictException, NotFoundException } from '@nestjs/common'
import { In, Not, Repository } from 'typeorm'
import { MovieService } from './movie.service'
import { MovieEntity } from './entities/movie.entity'
import { CategoryEntity } from '@/category/entities/category.entity'
import { StreamingEntity } from '@/streaming/entities/streaming.entity'

jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}))

describe('MovieService', () => {
  let service: MovieService
  let movieRepo: {
    findOne: jest.Mock
    create: jest.Mock
    save: jest.Mock
    remove: jest.Mock
    createQueryBuilder: jest.Mock
  }
  let categoryRepo: { findBy: jest.Mock }
  let streamingRepo: { findBy: jest.Mock }
  let queryBuilder: {
    andWhere: jest.Mock
    innerJoin: jest.Mock
    clone: jest.Mock
    leftJoinAndSelect: jest.Mock
    orderBy: jest.Mock
    skip: jest.Mock
    take: jest.Mock
    getCount: jest.Mock
    getMany: jest.Mock
  }

  const category: CategoryEntity = { id: 'cat-1', title: 'Sci-Fi' }
  const streaming: StreamingEntity = {
    id: 'stream-1',
    title: 'Netflix',
    imgUrl: 'https://example.com/netflix.png',
  }

  const movie: MovieEntity = {
    id: 'movie-1',
    title: 'Inception',
    description: 'A dream',
    releaseYear: 2010,
    durationInMinutes: 148,
    imgUrl: 'https://example.com/inception.png',
    categories: [category],
    streamingPlatforms: [streaming],
  }

  const mappedMovie = {
    id: movie.id,
    title: movie.title,
    description: movie.description,
    releaseYear: movie.releaseYear,
    durationInMinutes: movie.durationInMinutes,
    imgUrl: movie.imgUrl,
    categories: [{ id: category.id, title: category.title }],
    streamingPlatforms: [{ id: streaming.id, title: streaming.title, imgUrl: streaming.imgUrl }],
  }

  const createDto = {
    title: '  Inception  ',
    description: '  A dream  ',
    releaseYear: 2010,
    durationInMinutes: 148,
    imgUrl: 'https://example.com/inception.png',
    categoryIds: [category.id],
    streamingIds: [streaming.id],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      clone: jest.fn(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(1),
      getMany: jest.fn().mockResolvedValue([movie]),
    }
    queryBuilder.clone.mockReturnValue(queryBuilder)

    movieRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    }
    categoryRepo = { findBy: jest.fn() }
    streamingRepo = { findBy: jest.fn() }

    service = new MovieService(
      movieRepo as unknown as Repository<MovieEntity>,
      categoryRepo as unknown as Repository<CategoryEntity>,
      streamingRepo as unknown as Repository<StreamingEntity>,
    )
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a movie with relations and return the mapped response', async () => {
      movieRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(movie)
      categoryRepo.findBy.mockResolvedValue([category])
      streamingRepo.findBy.mockResolvedValue([streaming])
      movieRepo.create.mockReturnValue(movie)
      movieRepo.save.mockResolvedValue(movie)

      const result = await service.create(createDto)

      expect(movieRepo.findOne).toHaveBeenNthCalledWith(1, { where: { title: 'Inception' } })
      expect(categoryRepo.findBy).toHaveBeenCalledWith({ id: In([category.id]) })
      expect(streamingRepo.findBy).toHaveBeenCalledWith({ id: In([streaming.id]) })
      expect(movieRepo.create).toHaveBeenCalledWith({
        title: 'Inception',
        description: 'A dream',
        releaseYear: 2010,
        durationInMinutes: 148,
        imgUrl: createDto.imgUrl,
        categories: [category],
        streamingPlatforms: [streaming],
      })
      expect(result).toEqual(mappedMovie)
    })

    it('should store a blank description as null and skip empty relation ids', async () => {
      movieRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        ...movie,
        description: null,
        categories: [],
        streamingPlatforms: [],
      })
      movieRepo.create.mockReturnValue(movie)
      movieRepo.save.mockResolvedValue(movie)

      await service.create({
        title: 'Inception',
        description: '   ',
        releaseYear: 2010,
        durationInMinutes: 148,
        imgUrl: createDto.imgUrl,
      })

      expect(categoryRepo.findBy).not.toHaveBeenCalled()
      expect(streamingRepo.findBy).not.toHaveBeenCalled()
      expect(movieRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null,
          categories: [],
          streamingPlatforms: [],
        }),
      )
    })

    it('should throw ConflictException when the title is already taken', async () => {
      movieRepo.findOne.mockResolvedValue(movie)

      await expect(service.create(createDto)).rejects.toBeInstanceOf(ConflictException)
      expect(movieRepo.save).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when a category is missing', async () => {
      movieRepo.findOne.mockResolvedValue(null)
      categoryRepo.findBy.mockResolvedValue([])

      await expect(service.create(createDto)).rejects.toBeInstanceOf(NotFoundException)
      expect(movieRepo.save).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when a streaming platform is missing', async () => {
      movieRepo.findOne.mockResolvedValue(null)
      categoryRepo.findBy.mockResolvedValue([category])
      streamingRepo.findBy.mockResolvedValue([])

      await expect(service.create(createDto)).rejects.toBeInstanceOf(NotFoundException)
      expect(movieRepo.save).not.toHaveBeenCalled()
    })
  })

  describe('findAll', () => {
    it('should paginate with default page and limit', async () => {
      const result = await service.findAll({})

      expect(movieRepo.createQueryBuilder).toHaveBeenCalledWith('movie')
      expect(queryBuilder.andWhere).not.toHaveBeenCalled()
      expect(queryBuilder.innerJoin).not.toHaveBeenCalled()
      expect(queryBuilder.skip).toHaveBeenCalledWith(0)
      expect(queryBuilder.take).toHaveBeenCalledWith(20)
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('movie.title', 'ASC')
      expect(result).toEqual({
        data: [mappedMovie],
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      })
    })

    it('should apply custom page and limit', async () => {
      queryBuilder.getCount.mockResolvedValue(25)

      const result = await service.findAll({ page: 2, limit: 10 })

      expect(queryBuilder.skip).toHaveBeenCalledWith(10)
      expect(queryBuilder.take).toHaveBeenCalledWith(10)
      expect(result.page).toBe(2)
      expect(result.limit).toBe(10)
      expect(result.total).toBe(25)
      expect(result.totalPages).toBe(3)
    })

    it('should filter by title when search is provided', async () => {
      await service.findAll({ search: '  inception  ' })

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('movie.title ILIKE :search', { search: '%inception%' })
    })

    it('should ignore blank search', async () => {
      queryBuilder.getCount.mockResolvedValue(0)
      queryBuilder.getMany.mockResolvedValue([])

      const result = await service.findAll({ search: '   ' })

      expect(queryBuilder.andWhere).not.toHaveBeenCalled()
      expect(result).toEqual({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      })
    })

    it('should filter by categoryId', async () => {
      await service.findAll({ categoryId: category.id })

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'movie.categories',
        'filterCategory',
        'filterCategory.id = :categoryId',
        { categoryId: category.id },
      )
    })
  })

  describe('findOne', () => {
    it('should return a mapped movie', async () => {
      movieRepo.findOne.mockResolvedValue(movie)

      const result = await service.findOne(movie.id)

      expect(movieRepo.findOne).toHaveBeenCalledWith({
        where: { id: movie.id },
        relations: { categories: true, streamingPlatforms: true },
      })
      expect(result).toEqual(mappedMovie)
    })

    it('should throw NotFoundException when the movie does not exist', async () => {
      movieRepo.findOne.mockResolvedValue(null)

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update scalar fields and reload the movie', async () => {
      const updated = { ...movie, title: 'Interstellar', description: null }
      movieRepo.findOne
        .mockResolvedValueOnce({ ...movie })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(updated)

      const result = await service.update(movie.id, { title: '  Interstellar  ', description: '   ' })

      expect(movieRepo.findOne).toHaveBeenNthCalledWith(2, {
        where: { title: 'Interstellar', id: Not(movie.id) },
      })
      expect(movieRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Interstellar', description: null }),
      )
      expect(result.title).toBe('Interstellar')
    })

    it('should replace categories and streaming platforms', async () => {
      movieRepo.findOne.mockResolvedValueOnce({ ...movie }).mockResolvedValueOnce(movie)
      categoryRepo.findBy.mockResolvedValue([category])
      streamingRepo.findBy.mockResolvedValue([streaming])

      await service.update(movie.id, { categoryIds: [category.id], streamingIds: [streaming.id] })

      expect(categoryRepo.findBy).toHaveBeenCalledWith({ id: In([category.id]) })
      expect(streamingRepo.findBy).toHaveBeenCalledWith({ id: In([streaming.id]) })
      expect(movieRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: [category],
          streamingPlatforms: [streaming],
        }),
      )
    })

    it('should throw ConflictException when the new title is taken', async () => {
      movieRepo.findOne.mockResolvedValueOnce({ ...movie }).mockResolvedValueOnce(movie)

      await expect(service.update(movie.id, { title: 'Taken' })).rejects.toBeInstanceOf(ConflictException)
      expect(movieRepo.save).not.toHaveBeenCalled()
    })

    it('should throw NotFoundException when the movie does not exist', async () => {
      movieRepo.findOne.mockResolvedValue(null)

      await expect(service.update('missing', { title: 'Interstellar' })).rejects.toBeInstanceOf(NotFoundException)
      expect(movieRepo.save).not.toHaveBeenCalled()
    })
  })

  describe('remove', () => {
    it('should remove the movie', async () => {
      movieRepo.findOne.mockResolvedValue(movie)
      movieRepo.remove.mockResolvedValue(movie)

      await service.remove(movie.id)

      expect(movieRepo.remove).toHaveBeenCalledWith(movie)
    })

    it('should throw NotFoundException when the movie does not exist', async () => {
      movieRepo.findOne.mockResolvedValue(null)

      await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException)
      expect(movieRepo.remove).not.toHaveBeenCalled()
    })
  })
})
