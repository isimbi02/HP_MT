// ========== dispensations/dispensations.module.ts ==========
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DispensationsService } from './dispensations.service';
import { DispensationsController } from './dispensations.controller';
import { Dispensation } from './entities/dispensation.entity';
import { Medication } from '../medications/entities/medication.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Dispensation, Medication])],
  controllers: [DispensationsController],
  providers: [DispensationsService],
  exports: [DispensationsService],
})
export class DispensationsModule {}