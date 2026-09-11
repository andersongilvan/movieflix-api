import { IsEmail, IsOptional, IsString, Length } from 'class-validator'

export class CreateUserWithPasswordDto {
  @IsString()
  @Length(3, 255)
  name!: string

  @IsEmail()
  email!: string

  @IsString()
  @Length(8, 20)
  password!: string
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 255)
  name?: string

  @IsOptional()
  @IsEmail()
  email?: string
}

export interface UserResponseDto {
  id: string
  name: string
  email: string
  role: string
}
