import { PaginationDto } from '@/common/pagination/pagination.dto'
import { PartialType } from '@nestjs/mapped-types'
import { Type } from 'class-transformer'
import { ArrayUnique, IsArray, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator'

export class MovieQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string
}

export class CreateMovieDto {
  @IsString()
  @Length(1, 255)
  title!: string

  @IsOptional()
  @IsString()
  description?: string

  @Type(() => Number)
  @IsInt()
  @Min(1888)
  @Max(2100)
  releaseYear!: number

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationInMinutes!: number

  @IsString()
  @Length(1, 255)
  imgUrl!: string

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  categoryIds?: string[]

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  streamingIds?: string[]
}

export class UpdateMovieDto extends PartialType(CreateMovieDto) {}

export interface MovieCategoryResponseDto {
  id: string
  title: string
}

export interface MovieStreamingResponseDto {
  id: string
  title: string
  imgUrl: string
}

export interface MovieResponseDto {
  id: string
  title: string
  description: string | null
  releaseYear: number
  durationInMinutes: number
  imgUrl: string
  categories: MovieCategoryResponseDto[]
  streamingPlatforms: MovieStreamingResponseDto[]
}
