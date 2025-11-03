import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog, ActivityType } from './entities/activity-log.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private logsRepository: Repository<ActivityLog>,
  ) {}

  async create(
    type: ActivityType,
    userId: string,
    targetId: string,
    targetType: string,
    description: string,
    metadata?: any,
  ) {
    const log = this.logsRepository.create({
      type,
      userId,
      targetId,
      targetType,
      description,
      metadata,
    });

    return this.logsRepository.save(log);
  }

  async findAll(userId?: string, targetType?: string, limit: number = 100) {
    const query = this.logsRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .take(limit);

    if (userId) {
      query.where('log.userId = :userId', { userId });
    }

    if (targetType) {
      query.andWhere('log.targetType = :targetType', { targetType });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    return this.logsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async getActivityByUser(userId: string, limit: number = 50) {
    return this.logsRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

