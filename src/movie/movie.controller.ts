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
  Query,
  UseGuards,
} from '@nestjs/common'
import { MovieService } from './movie.service'
import { AuthGuard } from '@/auth/guards/auth.guard'
import { RequiredRulesGuard } from '@/auth/guards/required-rules.guard'
import { RequiredRules } from '@/auth/decorators/required-rules.decorator'
import { UserRole } from '@/user/enum/user-role.enum'
import { CreateMovieDto, MovieQueryDto, UpdateMovieDto } from './dto'

@UseGuards(AuthGuard, RequiredRulesGuard)
@RequiredRules(UserRole.USER)
@Controller('movie')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() dto: CreateMovieDto) {
    return this.movieService.create(dto)
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(@Query() query: MovieQueryDto) {
    return this.movieService.findAll(query)
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.movieService.findOne(id)
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMovieDto) {
    return this.movieService.update(id, dto)
  }

  @RequiredRules(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.movieService.remove(id)
  }
}
