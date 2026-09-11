import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CategoryEntity } from './entities/category.entity'
import { CategoryResponseDto, CreateCategoryDto, UpdateCategoryDto } from './dto'

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryRepo.save(this.categoryRepo.create({ title: dto.title }))
    return this.toResponse(category)
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepo.find()
    return categories.map(category => this.toResponse(category))
  }

  async findOne(id: string): Promise<CategoryResponseDto> {
    return this.toResponse(await this.findEntityOrFail(id))
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.findEntityOrFail(id)
    Object.assign(category, dto)
    return this.toResponse(await this.categoryRepo.save(category))
  }

  async remove(id: string): Promise<void> {
    const category = await this.findEntityOrFail(id)
    await this.categoryRepo.remove(category)
  }

  private async findEntityOrFail(id: string): Promise<CategoryEntity> {
    const category = await this.categoryRepo.findOne({ where: { id } })
    if (!category) {
      throw new NotFoundException('Category not found')
    }
    return category
  }

  private toResponse(category: CategoryEntity): CategoryResponseDto {
    return {
      id: category.id,
      title: category.title,
    }
  }
}
