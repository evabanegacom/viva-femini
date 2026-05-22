import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Emmanuelle', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'emmanuelle@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 28, description: 'Average cycle length in days' })
  @IsOptional()
  @IsNumber()
  @Min(21)
  @Max(45)
  averageCycleLength?: number;

  @ApiPropertyOptional({ example: 5, description: 'Average period length in days' })
  @IsOptional()
  @IsNumber()
  @Min(2)
  @Max(10)
  averagePeriodLength?: number;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}