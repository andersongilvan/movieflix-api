import { Pagination } from '@/common/pagination/pagination.interface'
import { CategoryEntity } from '@/category/entities/category.entity'
import { StreamingEntity } from '@/streaming/entities/streaming.entity'
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Not, Repository, SelectQueryBuilder } from 'typeorm'
import { CreateMovieDto, MovieQueryDto, MovieResponseDto, UpdateMovieDto } from './dto'
import { MovieEntity } from './entities/movie.entity'

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(MovieEntity)
    private readonly movieRepo: Repository<MovieEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(StreamingEntity)
    private readonly streamingRepo: Repository<StreamingEntity>,
  ) {}

  async create(dto: CreateMovieDto): Promise<MovieResponseDto> {
    await this.assertTitleIsUnique(dto.title)
    const categories = await this.findCategoriesOrFail(dto.categoryIds)
    const streamingPlatforms = await this.findStreamingsOrFail(dto.streamingIds)
    const movie = this.movieRepo.create({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      releaseYear: dto.releaseYear,
      durationInMinutes: dto.durationInMinutes,
      imgUrl: dto.imgUrl,
      categories,
      streamingPlatforms,
    })
    const saved = await this.movieRepo.save(movie)
    return this.toResponse(await this.findEntityOrFail(saved.id))
  }

  async findAll(query: MovieQueryDto): Promise<Pagination<MovieResponseDto>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit
    const filteredQuery = this.buildFilteredQuery(query)
    const total = await filteredQuery.getCount()
    const movies = await this.loadPage(filteredQuery, skip, limit)
    return this.toPagination(movies, page, limit, total)
  }

  async findOne(id: string): Promise<MovieResponseDto> {
    return this.toResponse(await this.findEntityOrFail(id))
  }

  async update(id: string, dto: UpdateMovieDto): Promise<MovieResponseDto> {
    const movie = await this.findEntityOrFail(id)
    if (dto.title) {
      await this.assertTitleIsUnique(dto.title, id)
      movie.title = dto.title.trim()
    }
    if (dto.description !== undefined) {
      movie.description = dto.description?.trim() || null
    }
    if (dto.releaseYear !== undefined) {
      movie.releaseYear = dto.releaseYear
    }
    if (dto.durationInMinutes !== undefined) {
      movie.durationInMinutes = dto.durationInMinutes
    }
    if (dto.imgUrl !== undefined) {
      movie.imgUrl = dto.imgUrl
    }
    if (dto.categoryIds) {
      movie.categories = await this.findCategoriesOrFail(dto.categoryIds)
    }
    if (dto.streamingIds) {
      movie.streamingPlatforms = await this.findStreamingsOrFail(dto.streamingIds)
    }
    await this.movieRepo.save(movie)
    return this.toResponse(await this.findEntityOrFail(id))
  }

  async remove(id: string): Promise<void> {
    const movie = await this.findEntityOrFail(id)
    await this.movieRepo.remove(movie)
  }

  private buildFilteredQuery(query: MovieQueryDto): SelectQueryBuilder<MovieEntity> {
    const qb = this.movieRepo.createQueryBuilder('movie')
    const search = query.search?.trim()
    if (search) {
      qb.andWhere('movie.title ILIKE :search', { search: `%${search}%` })
    }
    if (query.categoryId) {
      qb.innerJoin('movie.categories', 'filterCategory', 'filterCategory.id = :categoryId', {
        categoryId: query.categoryId,
      })
    }
    return qb
  }

  private async loadPage(
    filteredQuery: SelectQueryBuilder<MovieEntity>,
    skip: number,
    limit: number,
  ): Promise<MovieEntity[]> {
    return filteredQuery
      .clone()
      .leftJoinAndSelect('movie.categories', 'category')
      .leftJoinAndSelect('movie.streamingPlatforms', 'streaming')
      .orderBy('movie.title', 'ASC')
      .skip(skip)
      .take(limit)
      .getMany()
  }

  private toPagination(
    movies: MovieEntity[],
    page: number,
    limit: number,
    total: number,
  ): Pagination<MovieResponseDto> {
    return {
      data: movies.map(movie => this.toResponse(movie)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    }
  }

  private async assertTitleIsUnique(title: string, excludeId?: string): Promise<void> {
    const existing = await this.movieRepo.findOne({
      where: excludeId ? { title: title.trim(), id: Not(excludeId) } : { title: title.trim() },
    })
    if (existing) {
      throw new ConflictException('A movie with this title already exists')
    }
  }

  private async findCategoriesOrFail(ids?: string[]): Promise<CategoryEntity[]> {
    if (!ids?.length) {
      return []
    }

    const categoriesIds = [...new Set(ids)]

    const categories = await this.categoryRepo.findBy({ id: In(categoriesIds) })
    if (categories.length !== categoriesIds.length) {
      throw new NotFoundException('One or more categories were not found')
    }
    return categories
  }

  private async findStreamingsOrFail(ids?: string[]): Promise<StreamingEntity[]> {
    if (!ids?.length) {
      return []
    }

    const streamingsIds = [...new Set(ids)]

    const streamings = await this.streamingRepo.findBy({ id: In(streamingsIds) })
    if (streamings.length !== streamingsIds.length) {
      throw new NotFoundException('One or more streaming platforms were not found')
    }
    return streamings
  }

  private async findEntityOrFail(id: string): Promise<MovieEntity> {
    const movie = await this.movieRepo.findOne({
      where: { id },
      relations: { categories: true, streamingPlatforms: true },
    })
    if (!movie) {
      throw new NotFoundException('Movie not found')
    }
    return movie
  }

  private toResponse(movie: MovieEntity): MovieResponseDto {
    return {
      id: movie.id,
      title: movie.title,
      description: movie.description,
      releaseYear: movie.releaseYear,
      durationInMinutes: movie.durationInMinutes,
      imgUrl: movie.imgUrl,
      categories: (movie.categories ?? []).map(category => ({
        id: category.id,
        title: category.title,
      })),
      streamingPlatforms: (movie.streamingPlatforms ?? []).map(streaming => ({
        id: streaming.id,
        title: streaming.title,
        imgUrl: streaming.imgUrl,
      })),
    }
  }
}
