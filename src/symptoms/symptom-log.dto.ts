import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateSymptomLogDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d2', description: 'Cycle this log belongs to' })
  @IsMongoId()
  cycleId: string;

  @ApiProperty({ example: '2025-10-14', description: 'Date being logged (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiPropertyOptional({
    example: ['Cramps', 'Fatigue'],
    description: 'Physical pain symptoms',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  physicalSymptoms?: string[];

  @ApiPropertyOptional({
    example: ['Irritability', 'Cravings'],
    description: 'Mood & mental symptoms',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  moodSymptoms?: string[];

  @ApiPropertyOptional({
    example: ['Spotting'],
    description: 'Period indicators',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  periodIndicators?: string[];

  @ApiPropertyOptional({
    example: ['Decreased sex drive'],
    description: 'Sexual health observations',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sexualHealthSymptoms?: string[];

  @ApiPropertyOptional({ example: 5, description: 'Flow intensity 0 (none) – 10 (very heavy)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  flowIntensity?: number;

  @ApiPropertyOptional({ example: 'Felt tired after lunch' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSymptomLogDto extends PartialType(CreateSymptomLogDto) {}