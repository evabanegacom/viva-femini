import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SymptomLog, SymptomLogSchema } from './symptom-log.schema';
import { SymptomsController } from './symptoms.controller';
import { SymptomsService } from './symptoms.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SymptomLog.name, schema: SymptomLogSchema }]),
  ],
  controllers: [SymptomsController],
  providers: [SymptomsService],
  exports: [SymptomsService],
})
export class SymptomsModule {}