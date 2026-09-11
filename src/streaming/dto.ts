import { PartialType } from '@nestjs/mapped-types'
import { IsString, Length } from 'class-validator'

export class CreateStreamingDto {
  @IsString()
  @Length(1, 255)
  title!: string

  @IsString()
  @Length(1, 255)
  imgUrl!: string
}

export class UpdateStreamingDto extends PartialType(CreateStreamingDto) {}

export interface StreamingResponseDto {
  id: string
  title: string
  imgUrl: string
}
