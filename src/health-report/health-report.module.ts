import { Module } from '@nestjs/common';
import { CyclesModule } from '../cycles/cycles.module';
import { SymptomsModule } from '../symptoms/symptoms.module';
import { HealthReportController } from './health-report.controller';
import { HealthReportService } from './health-report.service';

@Module({
  imports: [CyclesModule, SymptomsModule],
  controllers: [HealthReportController],
  providers: [HealthReportService],
})
export class HealthReportModule {}