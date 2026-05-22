import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/user.schema';
import { Cycle, CycleSchema } from '../cycles/cycle.schema';
import { SymptomLog, SymptomLogSchema } from '../symptoms/symptom-log.schema';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Cycle.name, schema: CycleSchema },
      { name: SymptomLog.name, schema: SymptomLogSchema },
    ]),
  ],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}