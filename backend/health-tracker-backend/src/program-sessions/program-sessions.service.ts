import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramSession } from './entities/program-sessions.entity';
import { CreateProgramSessionDto, UpdateProgramSessionDto } from './dto/program-session.dto';
import { Program } from '../programs/entities/program.entity';
import { SessionBooking, BookingStatus } from '../session-bookings/entities/session-booking.entity';

@Injectable()
export class ProgramSessionsService {
  constructor(
    @InjectRepository(ProgramSession)
    private sessionsRepository: Repository<ProgramSession>,
    @InjectRepository(Program)
    private programsRepository: Repository<Program>,
    @InjectRepository(SessionBooking)
    private bookingsRepository: Repository<SessionBooking>,
  ) {}

  async create(createDto: CreateProgramSessionDto) {
    const program = await this.programsRepository.findOne({ where: { id: createDto.programId } });
    if (!program) {
      throw new NotFoundException('Program not found');
    }

    const session = this.sessionsRepository.create({
      ...createDto,
      scheduledDate: new Date(createDto.scheduledDate),
      capacity: createDto.capacity || 10,
      bookedCount: 0,
    });

    return this.sessionsRepository.save(session);
  }

  async findAll(programId?: string, upcomingOnly?: boolean) {
    const query = this.sessionsRepository.createQueryBuilder('session')
      .leftJoinAndSelect('session.program', 'program')
      .leftJoinAndSelect('session.bookings', 'bookings');

    if (programId) {
      query.where('session.programId = :programId', { programId });
    }

    if (upcomingOnly) {
      query.andWhere('session.scheduledDate >= :today', { today: new Date().toISOString().split('T')[0] });
    }

    query.orderBy('session.scheduledDate', 'ASC');
    query.addOrderBy('session.startTime', 'ASC');

    return query.getMany();
  }

  async findOne(id: string) {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['program', 'bookings', 'bookings.user', 'bookings.patient'],
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return session;
  }

  async update(id: string, updateDto: UpdateProgramSessionDto) {
    const session = await this.findOne(id);

    if (updateDto.scheduledDate) {
      session.scheduledDate = new Date(updateDto.scheduledDate);
    }

    Object.assign(session, updateDto);
    return this.sessionsRepository.save(session);
  }

  async remove(id: string) {
    const session = await this.findOne(id);
    await this.sessionsRepository.remove(session);
    return { message: 'Session deleted successfully' };
  }

  async getAvailableSessions(programId?: string) {
    const sessions = await this.findAll(programId, true);
    return sessions.filter(s => s.isActive && s.bookedCount < s.capacity);
  }
}

