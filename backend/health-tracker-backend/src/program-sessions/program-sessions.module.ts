import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramSessionsService } from './program-sessions.service';
import { ProgramSessionsController } from './program-sessions.controller';
import { ProgramSession } from './entities/program-sessions.entity';
import { Program } from '../programs/entities/program.entity';
import { SessionBooking } from '../session-bookings/entities/session-booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProgramSession, Program, SessionBooking])],
  controllers: [ProgramSessionsController],
  providers: [ProgramSessionsService],
  exports: [ProgramSessionsService],
})
export class ProgramSessionsModule {}

