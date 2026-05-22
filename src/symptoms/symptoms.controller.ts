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
import { SymptomsService } from './symptoms.service';
import { CreateSymptomLogDto, UpdateSymptomLogDto } from './symptom-log.dto';

@ApiTags('Symptoms / Daily Logs')
@Controller('symptoms')
export class SymptomsController {
  constructor(private readonly symptomsService: SymptomsService) {}

  @Post()
  @ApiOperation({ summary: 'Log symptoms for a day' })
  create(@Body() dto: CreateSymptomLogDto) {
    return this.symptomsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all logs for a user' })
  @ApiQuery({ name: 'userId', required: true })
  findByUser(@Query('userId') userId: string) {
    return this.symptomsService.findByUser(userId);
  }

  @Get('by-cycle')
  @ApiOperation({ summary: 'Get all logs for a specific cycle' })
  @ApiQuery({ name: 'cycleId', required: true })
  findByCycle(@Query('cycleId') cycleId: string) {
    return this.symptomsService.findByCycle(cycleId);
  }

  @Get('by-date')
  @ApiOperation({ summary: 'Get a log for a specific date' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'date', required: true, example: '2025-10-14' })
  findByDate(@Query('userId') userId: string, @Query('date') date: string) {
    return this.symptomsService.findByDate(userId, date);
  }

  @Get('frequency')
  @ApiOperation({
    summary: 'Get symptom frequency stats for Health Report screen',
    description: 'Returns each symptom with count and percentage across all logged days',
  })
  @ApiQuery({ name: 'userId', required: true })
  getFrequency(@Query('userId') userId: string) {
    return this.symptomsService.getFrequency(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single symptom log by ID' })
  findOne(@Param('id') id: string) {
    return this.symptomsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a symptom log' })
  update(@Param('id') id: string, @Body() dto: UpdateSymptomLogDto) {
    return this.symptomsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a symptom log' })
  remove(@Param('id') id: string) {
    return this.symptomsService.remove(id);
  }
}