import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { HealthReportService } from './health-report.service';

@ApiTags('Health Report')
@Controller('health-report')
export class HealthReportController {
  constructor(private readonly healthReportService: HealthReportService) {}

  @Get()
  @ApiOperation({
    summary: 'Get the full Health Report for a user',
    description:
      'Returns cycle summary, flow & symptom summary, symptom frequency charts, and historical cycle table. Optionally filter by month label (e.g. "Oct 2025").',
  })
  @ApiQuery({ name: 'userId', required: true, example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiQuery({ name: 'month', required: false, example: 'Oct 2025' })
  getReport(@Query('userId') userId: string, @Query('month') month?: string) {
    return this.healthReportService.getReport(userId, month);
  }
}