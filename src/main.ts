import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global prefix ────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── CORS (allow any origin in dev) ──────────────────────────────────
  app.enableCors();

  // ── Global validation pipe ──────────────────────────────────────────
  // Strips unknown fields, transforms payload types, validates DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // ── Global exception filter ─────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Global response interceptor ─────────────────────────────────────
  app.useGlobalInterceptors(new ResponseInterceptor());

  // ── Swagger / OpenAPI docs ──────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('VívaFemme API')
    .setDescription(
      'RESTful API for the VívaFemme menstrual health tracking app.\n\n' +
      'Covers: Users, Cycles, Daily Symptom Logs, and Health Reports.\n\n' +
      '**Quick start:** POST `/api/v1/seed` to populate demo data, then ' +
      'copy the returned `userId` to explore other endpoints.',
    )
    .setVersion('1.0')
    .addTag('Users', 'User account management')
    .addTag('Cycles', 'Menstrual cycle records')
    .addTag('Symptoms / Daily Logs', 'Daily symptom & flow tracking')
    .addTag('Health Report', 'Aggregated health insights')
    .addTag('Seed', 'Demo data generation')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`\n🌸 VívaFemme API is running`);
  console.log(`   → http://localhost:${port}/api/v1`);
  console.log(`   → Swagger docs: http://localhost:${port}/api/docs\n`);
}

bootstrap();