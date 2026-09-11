import { PartialType } from '@nestjs/mapped-types'
import { IsString, Length } from 'class-validator'

export class CreateCategoryDto {
  @IsString()
  @Length(1, 255)
  title!: string
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export interface CategoryResponseDto {
  id: string
  title: string
}
