import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator'

export class AuthUserWithPasswordDto {
  @IsEmail()
  email!: string

  @IsNotEmpty()
  password!: string
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string

  @IsString()
  @Length(8, 20)
  newPassword!: string
}

export interface AuthUserResponseDto {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
  accessToken: string
  refreshToken: string
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string
}
