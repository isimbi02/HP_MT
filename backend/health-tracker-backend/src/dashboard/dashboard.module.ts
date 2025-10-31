// ========== dashboard/dashboard.module.ts ==========
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { SessionRecord } from '../sessions/entities/session-record.entity';
import { Dispensation } from '../dispensations/entities/dispensation.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Program } from '../programs/entities/program.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Enrollment,
      SessionRecord,
      Dispensation,
      Patient,
      Program,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}