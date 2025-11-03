import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Medication } from '../../medications/entities/medication.entity';
import { User } from '../../users/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';

@Entity('dispensations')
export class Dispensation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.dispensations, { nullable: true })
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: Enrollment;

  @Column({ nullable: true })
  enrollmentId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ nullable: true })
  patientId: string;

  @Column({ type: 'date', nullable: true })
  nextDueDate: Date;

  @ManyToOne(() => Medication, (medication) => medication.dispensations)
  @JoinColumn({ name: 'medicationId' })
  medication: Medication;

  @Column()
  medicationId: string;

  @Column({ type: 'date' })
  dispensedDate: Date;

  @Column()
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => User, (user) => user.dispensedMedications)
  @JoinColumn({ name: 'dispensedById' })
  dispensedBy: User;

  @Column()
  dispensedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}