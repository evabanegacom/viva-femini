import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackingService } from './tracking.service';

/**
 * TrackingController — HTTP layer for the Tracking screen.
 * Delegates all logic to TrackingService.
 */
@ApiTags('Tracking')
@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('symptom-categories')
  @ApiOperation({
    summary: 'Get all symptom categories for the Tracking screen',
    description:
      'Returns the four pill-button groups: physicalPain, moodMental, ' +
      'periodIndicators, and sexualHealth. Strings match exactly what is ' +
      'stored in MongoDB symptom log documents.',
  })
  getSymptomCategories() {
    return this.trackingService.getSymptomCategories();
  }
}