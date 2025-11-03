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
    const requestDateStart = startOfDay(requestDate);

    // Build where condition for finding existing dispensations
    const whereCondition: any = {
      medicationId: checkDto.medicationId,
    };

    if (checkDto.enrollmentId) {
      whereCondition.enrollmentId = checkDto.enrollmentId;
    }

    if (checkDto.patientId) {
      whereCondition.patientId = checkDto.patientId;
    }

    // For daily medications, check if there's already a dispensation on the same date
    if (medication.frequency === Frequency.DAILY) {
      // Calculate the end of the requested day
      const requestDateEnd = new Date(requestDateStart);
      requestDateEnd.setHours(23, 59, 59, 999);

      // Check if there's any dispensation on the same date using date range
      const queryBuilder = this.dispensationsRepository
        .createQueryBuilder('dispensation')
        .where('dispensation.medicationId = :medicationId', { medicationId: checkDto.medicationId })
        .andWhere('dispensation.dispensedDate >= :startDate', { startDate: requestDateStart })
        .andWhere('dispensation.dispensedDate <= :endDate', { endDate: requestDateEnd });

      if (checkDto.patientId) {
        queryBuilder.andWhere('dispensation.patientId = :patientId', { patientId: checkDto.patientId });
      } else if (checkDto.enrollmentId) {
        queryBuilder.andWhere('dispensation.enrollmentId = :enrollmentId', { enrollmentId: checkDto.enrollmentId });
      }

      const existingDispensationToday = await queryBuilder.getOne();

      if (existingDispensationToday) {
        return {
          eligible: false,
          reason: `This daily medication has already been collected today (${requestDate.toLocaleDateString()}). Each medication can only be collected once per day.`,
        };
      }
    } else if (medication.frequency === Frequency.MONTHLY) {
      // For monthly medications, check if already collected this month
      const requestMonthStart = startOfMonth(requestDate);
      const existingDispensations = await this.dispensationsRepository.find({
        where: whereCondition,
      });

      const hasDispensationThisMonth = existingDispensations.some((disp) => {
        const dispMonthStart = startOfMonth(new Date(disp.dispensedDate));
        return dispMonthStart.getTime() === requestMonthStart.getTime();
      });

      if (hasDispensationThisMonth) {
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
      patientId: createDispensationDto.patientId,
      medicationId: createDispensationDto.medicationId,
      dispensedDate: createDispensationDto.dispensedDate,
    });

    if (!eligibility.eligible) {
      throw new ConflictException(eligibility.reason);
    }

    // Get medication to calculate next due date
    const medication = await this.medicationsRepository.findOne({
      where: { id: createDispensationDto.medicationId },
    });

    let nextDueDate: Date | undefined = undefined;
    if (medication) {
      const dispensedDate = new Date(createDispensationDto.dispensedDate);
      if (medication.frequency === Frequency.DAILY) {
        nextDueDate = new Date(dispensedDate);
        nextDueDate.setDate(nextDueDate.getDate() + 1);
      } else if (medication.frequency === Frequency.MONTHLY) {
        nextDueDate = new Date(dispensedDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      }
    }

    const dispensationData: Partial<Dispensation> = {
      medicationId: createDispensationDto.medicationId,
      dispensedDate: new Date(createDispensationDto.dispensedDate),
      quantity: createDispensationDto.quantity,
      dispensedById: userId,
    };

    if (createDispensationDto.enrollmentId) {
      dispensationData.enrollmentId = createDispensationDto.enrollmentId;
    }

    if (createDispensationDto.patientId) {
      dispensationData.patientId = createDispensationDto.patientId;
    }

    if (createDispensationDto.notes) {
      dispensationData.notes = createDispensationDto.notes;
    }

    if (nextDueDate) {
      dispensationData.nextDueDate = nextDueDate;
    }

    const dispensation = this.dispensationsRepository.create(dispensationData);

    return await this.dispensationsRepository.save(dispensation);
  }

  async findAll(): Promise<Dispensation[]> {
    return await this.dispensationsRepository.find({
      relations: ['enrollment', 'enrollment.patient', 'patient', 'medication', 'dispensedBy'],
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

  async findByPatient(patientId: string): Promise<Dispensation[]> {
    return await this.dispensationsRepository.find({
      where: { patientId },
      relations: ['medication', 'dispensedBy'],
      order: { dispensedDate: 'DESC' },
    });
  }
}