// ========== programs/dto/program.dto.ts ==========
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { SessionType, Frequency } from '../entities/program.entity';

export class CreateProgramDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: SessionType, isArray: true })
  @IsArray()
  @IsEnum(SessionType, { each: true })
  sessionTypes: SessionType[];

  @ApiProperty({ enum: Frequency })
  @IsEnum(Frequency)
  sessionFrequency: Frequency;

  @ApiProperty()
  @IsNumber()
  sessionCount: number;
}

export class UpdateProgramDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: SessionType, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(SessionType, { each: true })
  sessionTypes?: SessionType[];

  @ApiProperty({ enum: Frequency, required: false })
  @IsOptional()
  @IsEnum(Frequency)
  sessionFrequency?: Frequency;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sessionCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


