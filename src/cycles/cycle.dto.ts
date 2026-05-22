import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCycleDto {
  @ApiProperty({ example: '64f1a2b3c4d5e6f7a8b9c0d1', description: 'MongoDB User ID' })
  @IsMongoId()
  userId: string;

  @ApiProperty({ example: '2025-10-01', description: 'Period start date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-10-05', description: 'Period end date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 29 })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(60)
  cycleLength?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(15)
  periodLength?: number;

  @ApiPropertyOptional({ example: 'October 2025' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 'Felt heavier flow this month' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCycleDto extends PartialType(CreateCycleDto) {}