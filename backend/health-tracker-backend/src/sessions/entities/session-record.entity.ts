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
import { User } from '../../users/entities/user.entity';
import { SessionType } from '../../programs/entities/program.entity';

export enum AttendanceStatus {
  ATTENDED = 'attended',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
}

@Entity('session_records')
export class SessionRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Enrollment, (enrollment) => enrollment.sessionRecords)
  @JoinColumn({ name: 'enrollmentId' })
  enrollment: Enrollment;

  @Column()
  enrollmentId: string;

  @Column({
    type: 'enum',
    enum: SessionType,
  })
  sessionType: SessionType;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
  })
  status: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @ManyToOne(() => User, (user) => user.recordedSessions)
  @JoinColumn({ name: 'recordedById' })
  recordedBy: User;

  @Column()
  recordedById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}