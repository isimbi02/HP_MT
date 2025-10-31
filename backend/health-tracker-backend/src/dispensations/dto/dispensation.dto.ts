// ========== dispensations/dto/dispensation.dto.ts ==========
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber} from 'class-validator';

export class CreateDispensationDto {
  @ApiProperty()
  @IsString()
  enrollmentId: string;

  @ApiProperty()
  @IsString()
  medicationId: string;

  @ApiProperty()
  @IsString()
  dispensedDate: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckEligibilityDto {
  @ApiProperty()
  @IsString()
  enrollmentId: string;

  @ApiProperty()
  @IsString()
  medicationId: string;

  @ApiProperty()
  @IsString()
  dispensedDate: string;
}