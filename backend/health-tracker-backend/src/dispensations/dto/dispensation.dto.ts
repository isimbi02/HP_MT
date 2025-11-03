// ========== dispensations/dto/dispensation.dto.ts ==========
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber} from 'class-validator';

export class CreateDispensationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enrollmentId?: string;

  @ApiProperty()
  @IsString()
  medicationId: string;

  @ApiProperty()
  @IsString()
  dispensedDate: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckEligibilityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enrollmentId?: string;

  @ApiProperty()
  @IsString()
  medicationId: string;

  @ApiProperty()
  @IsString()
  dispensedDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;
}