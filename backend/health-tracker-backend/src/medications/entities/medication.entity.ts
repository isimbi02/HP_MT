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
import { Program} from '../../programs/entities/program.entity';
import { Dispensation } from '../../dispensations/entities/dispensation.entity';
import { Frequency } from '../dto/medication.dto';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity'; 



@Entity('medications')
export class Medication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  dose: string;

  @Column({
    type: 'enum',
    enum: Frequency,
  })
  frequency: Frequency;

  @Column({ type: 'text', nullable: true })
  instructions: string;

  @ManyToOne(() => Program, (program) => program.medications, { nullable: true })
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column({ nullable: true })
  programId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ nullable: true })
  patientId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'prescribedById' })
  prescribedBy: User;

  @Column({ nullable: true })
  prescribedById: string;

  @Column({ type: 'date', nullable: true })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Dispensation, (dispensation) => dispensation.medication)
  dispensations: Dispensation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}