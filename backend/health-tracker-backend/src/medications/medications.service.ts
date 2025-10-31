// ========== medications/medications.service.ts ==========
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Medication } from './entities/medication.entity';
import { CreateMedicationDto, UpdateMedicationDto } from './dto/medication.dto';

@Injectable()
export class MedicationsService {
  constructor(
    @InjectRepository(Medication)
    private medicationsRepository: Repository<Medication>,
  ) {}

  async create(createMedicationDto: CreateMedicationDto): Promise<Medication> {
    const medication = this.medicationsRepository.create(createMedicationDto);
    return await this.medicationsRepository.save(medication);
  }

  async findAll(): Promise<Medication[]> {
    return await this.medicationsRepository.find({
      relations: ['program'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProgram(programId: string): Promise<Medication[]> {
    return await this.medicationsRepository.find({
      where: { programId, isActive: true },
    });
  }

  async findOne(id: string): Promise<Medication> {
    const medication = await this.medicationsRepository.findOne({
      where: { id },
      relations: ['program'],
    });

    if (!medication) {
      throw new NotFoundException(`Medication with ID ${id} not found`);
    }

    return medication;
  }

  async update(id: string, updateMedicationDto: UpdateMedicationDto): Promise<Medication> {
    const medication = await this.findOne(id);
    Object.assign(medication, updateMedicationDto);
    return await this.medicationsRepository.save(medication);
  }

  async remove(id: string): Promise<void> {
    const medication = await this.findOne(id);
    await this.medicationsRepository.remove(medication);
  }
}