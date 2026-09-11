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
import { CategoryService } from './category.service'
import { CreateCategoryDto, UpdateCategoryDto } from './dto'
import { AuthGuard } from '@/auth/guards/auth.guard'
import { RequiredRulesGuard } from '@/auth/guards/required-rules.guard'
import { RequiredRules } from '@/auth/decorators/required-rules.decorator'
import { UserRole } from '@/user/enum/user-role.enum'

@UseGuards(AuthGuard, RequiredRulesGuard)
@RequiredRules(UserRole.USER)
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto)
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll() {
    return this.categoryService.findAll()
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.findOne(id)
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoryService.update(id, dto)
  }

  @RequiredRules(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoryService.remove(id)
  }
}
