import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ActivityType {
  ENROLLMENT_CREATED = 'enrollment_created',
  SESSION_RECORDED = 'session_recorded',
  MEDICATION_DISPENSED = 'medication_dispensed',
  PROGRAM_CREATED = 'program_created',
  USER_REGISTERED = 'user_registered',
  SESSION_BOOKED = 'session_booked',
  SESSION_CANCELLED = 'session_cancelled',
  MEDICATION_ASSIGNED = 'medication_assigned',
  PATIENT_CREATED = 'patient_created',
}

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column()
  targetId: string;

  @Column()
  targetType: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}

