// ========== sessions/dto/session.dto.ts ==========
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { SessionType } from '../../programs/entities/program.entity';
import { AttendanceStatus } from '../entities/session-record.entity';

export class CreateSessionRecordDto {
  @ApiProperty()
  @IsString()
  enrollmentId: string;

  @ApiProperty({ enum: SessionType })
  @IsEnum(SessionType)
  sessionType: SessionType;

  @ApiProperty()
  @IsString()
  scheduledDate: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}

export class UpdateSessionRecordDto {
  @ApiProperty({ enum: AttendanceStatus, required: false })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}