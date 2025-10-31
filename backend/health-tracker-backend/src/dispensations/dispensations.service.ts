// ========== dispensations/dispensations.service.ts ==========
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medication } from 'src/medications/entities/medication.entity';
import { Dispensation } from './entities/dispensation.entity';
import { CreateDispensationDto, CheckEligibilityDto } from './dto/dispensation.dto';
import { Frequency } from '../programs/entities/program.entity';
import { startOfDay, startOfMonth, differenceInDays, differenceInMonths } from 'date-fns';

@Injectable()
export class DispensationsService {
  constructor(
    @InjectRepository(Dispensation)
    private dispensationsRepository: Repository<Dispensation>,
    @InjectRepository(Medication)
    private medicationsRepository: Repository<Medication>,
  ) {}

  async checkEligibility(checkDto: CheckEligibilityDto): Promise<{ eligible: boolean; reason?: string }> {
    const medication = await this.medicationsRepository.findOne({
      where: { id: checkDto.medicationId },
    });

    if (!medication) {
      return { eligible: false, reason: 'Medication not found' };
    }

    const requestDate = new Date(checkDto.dispensedDate);

    // Find the most recent dispensation for this medication and enrollment
    const lastDispensation = await this.dispensationsRepository.findOne({
      where: {
        enrollmentId: checkDto.enrollmentId,
        medicationId: checkDto.medicationId,
      },
      order: { dispensedDate: 'DESC' },
    });

    if (!lastDispensation) {
      return { eligible: true };
    }

    const lastDate = new Date(lastDispensation.dispensedDate);

    // Check based on frequency
    if (medication.frequency === Frequency.DAILY) {
      const daysDiff = differenceInDays(startOfDay(requestDate), startOfDay(lastDate));
      if (daysDiff < 1) {
        return {
          eligible: false,
          reason: 'Daily medication already collected today',
        };
      }
    } else if (medication.frequency === Frequency.MONTHLY) {
      const monthsDiff = differenceInMonths(startOfMonth(requestDate), startOfMonth(lastDate));
      if (monthsDiff < 1) {
        return {
          eligible: false,
          reason: 'Monthly medication already collected this month',
        };
      }
    }

    return { eligible: true };
  }

  async create(createDispensationDto: CreateDispensationDto, userId: string): Promise<Dispensation> {
    // Check eligibility
    const eligibility = await this.checkEligibility({
      enrollmentId: createDispensationDto.enrollmentId,
      medicationId: createDispensationDto.medicationId,
      dispensedDate: createDispensationDto.dispensedDate,
    });

    if (!eligibility.eligible) {
      throw new ConflictException(eligibility.reason);
    }

    const dispensation = this.dispensationsRepository.create({
      ...createDispensationDto,
      dispensedById: userId,
    });

    return await this.dispensationsRepository.save(dispensation);
  }

  async findAll(): Promise<Dispensation[]> {
    return await this.dispensationsRepository.find({
      relations: ['enrollment', 'enrollment.patient', 'medication', 'dispensedBy'],
      order: { dispensedDate: 'DESC' },
    });
  }

  async findByEnrollment(enrollmentId: string): Promise<Dispensation[]> {
    return await this.dispensationsRepository.find({
      where: { enrollmentId },
      relations: ['medication', 'dispensedBy'],
      order: { dispensedDate: 'DESC' },
    });
  }
}