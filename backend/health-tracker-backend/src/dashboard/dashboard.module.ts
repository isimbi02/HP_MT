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
import { ProgramSession } from '../program-sessions/entities/program-sessions.entity';
import { SessionBooking } from '../session-bookings/entities/session-booking.entity';
import { Medication } from '../medications/entities/medication.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Enrollment,
      SessionRecord,
      Dispensation,
      Patient,
      Program,
      ProgramSession,
      SessionBooking,
      Medication,
      User,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}