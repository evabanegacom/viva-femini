import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('Seed')
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Populate the database with realistic demo data',
    description:
      'Creates a demo user (Emmanuelle), 3 cycles, and daily symptom logs. ' +
      'WARNING: clears all existing data first.',
  })
  seed() {
    return this.seedService.seed();
  }
}