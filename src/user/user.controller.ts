import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { UserService } from './user.service'
import { CreateUserWithPasswordDto, UpdateUserDto } from './dto'
import { AuthGuard } from '@/auth/guards/auth.guard'
import { RequiredRulesGuard } from '@/auth/guards/required-rules.guard'
import { RequiredRules } from '@/auth/decorators/required-rules.decorator'
import { UserRole } from './enum/user-role.enum'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  createUserWithPassword(@Body() dto: CreateUserWithPasswordDto) {
    return this.userService.registerUserWithPassword(dto)
  }

  @UseGuards(AuthGuard, RequiredRulesGuard)
  @RequiredRules(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.userService.findAll()
  }

  @UseGuards(AuthGuard, RequiredRulesGuard)
  @RequiredRules(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id)
  }

  @UseGuards(AuthGuard, RequiredRulesGuard)
  @RequiredRules(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Patch(':id/admin')
  promoteToAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.promoteToAdmin(id)
  }

  @UseGuards(AuthGuard, RequiredRulesGuard)
  @RequiredRules(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto)
  }

  @UseGuards(AuthGuard, RequiredRulesGuard)
  @RequiredRules(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id)
  }
}
