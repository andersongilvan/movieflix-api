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
import { StreamingService } from './streaming.service'
import { CreateStreamingDto, UpdateStreamingDto } from './dto'
import { PaginationDto } from '@/common/pagination/pagination.dto'
import { AuthGuard } from '@/auth/guards/auth.guard'
import { RequiredRulesGuard } from '@/auth/guards/required-rules.guard'
import { RequiredRules } from '@/auth/decorators/required-rules.decorator'
import { UserRole } from '@/user/enum/user-role.enum'

@UseGuards(AuthGuard, RequiredRulesGuard)
@RequiredRules(UserRole.USER)
@Controller('streaming')
export class StreamingController {
  constructor(private readonly streamingService: StreamingService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() dto: CreateStreamingDto) {
    return this.streamingService.create(dto)
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  findAll(@Query() query: PaginationDto) {
    return this.streamingService.findAll(query)
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.streamingService.findOne(id)
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStreamingDto) {
    return this.streamingService.update(id, dto)
  }

  @RequiredRules(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.streamingService.remove(id)
  }
}
