import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { CyclesModule } from './cycles/cycles.module';
import { SymptomsModule } from './symptoms/symptoms.module';
import { HealthReportModule } from './health-report/health-report.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    // Load .env file and make ConfigService available everywhere
    ConfigModule.forRoot({ isGlobal: true }),

    // Connect to MongoDB using env variable; falls back to local dev DB
    // MongooseModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //     uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/vivafemme'),
    //   }),
    //   inject: [ConfigService],
    // }),

    MongooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return {
      uri: configService.get<string>('MONGODB_URI') 
        || 'mongodb://localhost:27017/vivafemme',
    };
  },
}),

    // Feature modules
    UsersModule,
    CyclesModule,
    SymptomsModule,
    HealthReportModule,
    SeedModule,
  ],
})
export class AppModule {}