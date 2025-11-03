import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionBookingsService } from './session-bookings.service';
import { SessionBookingsController } from './session-bookings.controller';
import { SessionBooking } from './entities/session-booking.entity';
import { ProgramSession } from '../program-sessions/entities/program-sessions.entity';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { ActivityLog } from '../activity-logs/entities/activity-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SessionBooking, ProgramSession, User, Patient, ActivityLog])],
  controllers: [SessionBookingsController],
  providers: [SessionBookingsService],
  exports: [SessionBookingsService],
})
export class SessionBookingsModule {}

