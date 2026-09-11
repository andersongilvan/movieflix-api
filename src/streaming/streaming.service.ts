import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsWhere, ILike, Repository } from 'typeorm'
import { StreamingEntity } from './entities/streaming.entity'
import { CreateStreamingDto, StreamingResponseDto, UpdateStreamingDto } from './dto'
import { PaginationDto } from '@/common/pagination/pagination.dto'
import { Pagination } from '@/common/pagination/pagination.interface'

@Injectable()
export class StreamingService {
  constructor(
    @InjectRepository(StreamingEntity)
    private readonly streamingRepo: Repository<StreamingEntity>,
  ) {}

  async create(dto: CreateStreamingDto): Promise<StreamingResponseDto> {
    const streaming = await this.streamingRepo.save(this.streamingRepo.create({ title: dto.title, imgUrl: dto.imgUrl }))
    return this.toResponse(streaming)
  }

  async findAll(query: PaginationDto): Promise<Pagination<StreamingResponseDto>> {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const skip = (page - 1) * limit
    const where = this.buildSearchFilter(query.search)

    const [streamings, total] = await this.streamingRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { title: 'ASC' },
    })

    return this.toPagination(streamings, page, limit, total)
  }

  async findOne(id: string): Promise<StreamingResponseDto> {
    return this.toResponse(await this.findEntityOrFail(id))
  }

  async update(id: string, dto: UpdateStreamingDto): Promise<StreamingResponseDto> {
    const streaming = await this.findEntityOrFail(id)
    Object.assign(streaming, dto)
    return this.toResponse(await this.streamingRepo.save(streaming))
  }

  async remove(id: string): Promise<void> {
    const streaming = await this.findEntityOrFail(id)
    await this.streamingRepo.remove(streaming)
  }

  private buildSearchFilter(search?: string): FindOptionsWhere<StreamingEntity> | undefined {
    const term = search?.trim()
    if (!term) {
      return undefined
    }
    return { title: ILike(`%${term}%`) }
  }

  private toPagination(
    streamings: StreamingEntity[],
    page: number,
    limit: number,
    total: number,
  ): Pagination<StreamingResponseDto> {
    return {
      data: streamings.map(streaming => this.toResponse(streaming)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    }
  }

  private async findEntityOrFail(id: string): Promise<StreamingEntity> {
    const streaming = await this.streamingRepo.findOne({ where: { id } })
    if (!streaming) {
      throw new NotFoundException('Streaming not found')
    }
    return streaming
  }

  private toResponse(streaming: StreamingEntity): StreamingResponseDto {
    return {
      id: streaming.id,
      title: streaming.title,
      imgUrl: streaming.imgUrl,
    }
  }
}
