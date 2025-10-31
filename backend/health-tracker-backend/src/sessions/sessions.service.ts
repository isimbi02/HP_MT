// ========== sessions/sessions.service.ts ==========
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionRecord } from './entities/session-record.entity';
import { CreateSessionRecordDto, UpdateSessionRecordDto } from './dto/session.dto';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(SessionRecord)
    private sessionsRepository: Repository<SessionRecord>,
  ) {}

  async create(createSessionDto: CreateSessionRecordDto, userId: string): Promise<SessionRecord> {
    const session = this.sessionsRepository.create({
      ...createSessionDto,
      recordedById: userId,
    });
    return await this.sessionsRepository.save(session);
  }

  async findAll(): Promise<SessionRecord[]> {
    return await this.sessionsRepository.find({
      relations: ['enrollment', 'enrollment.patient', 'enrollment.program', 'recordedBy'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async findByEnrollment(enrollmentId: string): Promise<SessionRecord[]> {
    return await this.sessionsRepository.find({
      where: { enrollmentId },
      relations: ['recordedBy'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SessionRecord> {
    const session = await this.sessionsRepository.findOne({
      where: { id },
      relations: ['enrollment', 'enrollment.patient', 'enrollment.program', 'recordedBy'],
    });

    if (!session) {
      throw new NotFoundException(`Session record with ID ${id} not found`);
    }

    return session;
  }

  async update(id: string, updateSessionDto: UpdateSessionRecordDto): Promise<SessionRecord> {
    const session = await this.findOne(id);
    Object.assign(session, updateSessionDto);
    return await this.sessionsRepository.save(session);
  }
}
