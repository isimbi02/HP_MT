import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Medication } from '../../medications/entities/medication.entity';
import { ProgramSession } from '../../program-sessions/entities/program-sessions.entity';

export enum SessionType {
  ONE_ON_ONE = 'one_on_one',
  GROUP_DISCUSSION = 'group_discussion',
  CONSULTATION = 'consultation',
}

export enum Frequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

@Entity('programs')
export class Program {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: SessionType,
    array: true,
  })
  sessionTypes: SessionType[];

  @Column({
    type: 'enum',
    enum: Frequency,
  })
  sessionFrequency: Frequency;

  @Column({ default: 0 })
  sessionCount: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Enrollment, (enrollment) => enrollment.program)
  enrollments: Enrollment[];

  @OneToMany(() => Medication, (medication) => medication.program)
  medications: Medication[];

  @OneToMany(() => ProgramSession, (session) => session.program)
  sessions: ProgramSession[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}