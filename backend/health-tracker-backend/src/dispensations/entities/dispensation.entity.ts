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

@Entity('dispensations')
export class Dispensation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.dispensations)
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: Enrollment;

  @Column()
  enrollmentId: string;

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