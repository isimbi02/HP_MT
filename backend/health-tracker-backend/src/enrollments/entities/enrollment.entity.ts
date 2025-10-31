import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { Program } from '../../programs/entities/program.entity';
import { SessionRecord } from '../../sessions/entities/session-record.entity';
import { Dispensation } from '../../dispensations/entities/dispensation.entity';

export enum EnrollmentStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, (patient) => patient.enrollments)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  patientId: string;

  @ManyToOne(() => Program, (program) => program.enrollments)
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column()
  programId: string;

  @Column({ type: 'date' })
  enrollmentDate: Date;

  @Column({ type: 'date', nullable: true })
  completionDate: Date;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ONGOING,
  })
  status: EnrollmentStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => SessionRecord, (sessionRecord) => sessionRecord.enrollment)
  sessionRecords: SessionRecord[];

  @OneToMany(() => Dispensation, (dispensation) => dispensation.enrollment)
  dispensations: Dispensation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}