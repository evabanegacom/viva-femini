import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CyclesService } from './cycles.service';
import { CreateCycleDto, UpdateCycleDto } from './cycle.dto';

@ApiTags('Cycles')
@Controller('cycles')
export class CyclesController {
  constructor(private readonly cyclesService: CyclesService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new cycle / start a period' })
  create(@Body() dto: CreateCycleDto) {
    return this.cyclesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List cycles for a user' })
  @ApiQuery({ name: 'userId', required: true, description: 'MongoDB User ID' })
  findByUser(@Query('userId') userId: string) {
    return this.cyclesService.findByUser(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get cycle statistics for a user' })
  @ApiQuery({ name: 'userId', required: true })
  getStats(@Query('userId') userId: string) {
    return this.cyclesService.getStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single cycle by ID' })
  findOne(@Param('id') id: string) {
    return this.cyclesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cycle (e.g. set end date)' })
  update(@Param('id') id: string, @Body() dto: UpdateCycleDto) {
    return this.cyclesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a cycle record' })
  remove(@Param('id') id: string) {
    return this.cyclesService.remove(id);
  }
}