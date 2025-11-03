import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionBooking, BookingStatus } from './entities/session-booking.entity';
import { CreateSessionBookingDto, UpdateSessionBookingDto } from './dto/session-booking.dto';
import { ProgramSession } from '../program-sessions/entities/program-sessions.entity';
import { User } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { ActivityLog, ActivityType } from '../activity-logs/entities/activity-log.entity';

@Injectable()
export class SessionBookingsService {
  constructor(
    @InjectRepository(SessionBooking)
    private bookingsRepository: Repository<SessionBooking>,
    @InjectRepository(ProgramSession)
    private sessionsRepository: Repository<ProgramSession>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(ActivityLog)
    private activityLogsRepository: Repository<ActivityLog>,
  ) {}

  async create(createDto: CreateSessionBookingDto, staffUserId?: string) {
    const session = await this.sessionsRepository.findOne({
      where: { id: createDto.sessionId },
      relations: ['bookings'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (!session.isActive) {
      throw new BadRequestException('Session is not active');
    }

    if (session.bookedCount >= session.capacity) {
      throw new BadRequestException('Session is full');
    }

    // Check if user/patient already booked this session
    if (createDto.userId) {
      const existingBooking = await this.bookingsRepository.findOne({
        where: {
          sessionId: createDto.sessionId,
          userId: createDto.userId,
          status: BookingStatus.BOOKED,
        },
      });

      if (existingBooking) {
        throw new BadRequestException('User already booked this session');
      }
    }

    if (createDto.patientId) {
      const existingBooking = await this.bookingsRepository.findOne({
        where: {
          sessionId: createDto.sessionId,
          patientId: createDto.patientId,
          status: BookingStatus.BOOKED,
        },
      });

      if (existingBooking) {
        throw new BadRequestException('Patient already booked this session');
      }
    }

    const booking = this.bookingsRepository.create({
      ...createDto,
      status: BookingStatus.BOOKED,
    });

    const savedBooking = await this.bookingsRepository.save(booking);

    // Update session booked count
    session.bookedCount += 1;
    await this.sessionsRepository.save(session);

    // Log activity
    if (staffUserId) {
      await this.activityLogsRepository.save({
        type: ActivityType.SESSION_BOOKED,
        userId: staffUserId,
        targetId: savedBooking.id,
        targetType: 'session_booking',
        description: `Session booking created for session ${session.id}`,
        metadata: { sessionId: session.id, bookingId: savedBooking.id },
      });
    }

    return this.findOne(savedBooking.id);
  }

  async findAll(userId?: string, patientId?: string, sessionId?: string) {
    const query = this.bookingsRepository.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.session', 'session')
      .leftJoinAndSelect('session.program', 'program')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.patient', 'patient');

    if (userId) {
      query.where('booking.userId = :userId', { userId });
    }

    if (patientId) {
      query.where('booking.patientId = :patientId', { patientId });
    }

    if (sessionId) {
      query.where('booking.sessionId = :sessionId', { sessionId });
    }

    query.orderBy('booking.bookedAt', 'DESC');

    return query.getMany();
  }

  async findOne(id: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['session', 'session.program', 'user', 'patient'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async update(id: string, updateDto: UpdateSessionBookingDto, staffUserId?: string) {
    const booking = await this.findOne(id);

    if (updateDto.status) {
      booking.status = updateDto.status;
    }

    if (updateDto.notes !== undefined) {
      booking.notes = updateDto.notes;
    }

    const savedBooking = await this.bookingsRepository.save(booking);

    // Log activity
    if (staffUserId) {
      await this.activityLogsRepository.save({
        type: ActivityType.SESSION_CANCELLED,
        userId: staffUserId,
        targetId: savedBooking.id,
        targetType: 'session_booking',
        description: `Session booking ${updateDto.status} for session ${booking.sessionId}`,
        metadata: { bookingId: savedBooking.id, status: updateDto.status },
      });
    }

    return savedBooking;
  }

  async cancel(id: string, staffUserId?: string) {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking is already cancelled');
    }

    booking.status = BookingStatus.CANCELLED;
    const savedBooking = await this.bookingsRepository.save(booking);

    // Update session booked count
    const session = await this.sessionsRepository.findOne({ where: { id: booking.sessionId } });
    if (session) {
      session.bookedCount = Math.max(0, session.bookedCount - 1);
      await this.sessionsRepository.save(session);
    }

    // Log activity
    if (staffUserId) {
      await this.activityLogsRepository.save({
        type: ActivityType.SESSION_CANCELLED,
        userId: staffUserId,
        targetId: savedBooking.id,
        targetType: 'session_booking',
        description: `Session booking cancelled for session ${booking.sessionId}`,
        metadata: { bookingId: savedBooking.id },
      });
    }

    return savedBooking;
  }

  async remove(id: string) {
    const booking = await this.findOne(id);
    await this.bookingsRepository.remove(booking);

    // Update session booked count
    const session = await this.sessionsRepository.findOne({ where: { id: booking.sessionId } });
    if (session) {
      session.bookedCount = Math.max(0, session.bookedCount - 1);
      await this.sessionsRepository.save(session);
    }

    return { message: 'Booking deleted successfully' };
  }
}

