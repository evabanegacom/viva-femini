import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { CyclesModule } from './cycles/cycles.module';
import { SymptomsModule } from './symptoms/symptoms.module';
import { HealthReportModule } from './health-report/health-report.module';
import { SeedModule } from './seed/seed.module';
import { TrackingModule } from './tracking/tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): MongooseModuleFactoryOptions => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/vivafemme'),
      }),
      inject: [ConfigService],
    }),

    UsersModule,
    CyclesModule,
    SymptomsModule,
    HealthReportModule,
    SeedModule,
    TrackingModule,
  ],
})
export class AppModule {}