import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProgramSession } from '../../program-sessions/entities/program-sessions.entity';
import { User } from '../../users/entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';

export enum BookingStatus {
  BOOKED = 'booked',
  ATTENDED = 'attended',
  CANCELLED = 'cancelled',
  MISSED = 'missed',
}

@Entity('session_bookings')
export class SessionBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProgramSession, (session) => session.bookings)
  @JoinColumn({ name: 'sessionId' })
  session: ProgramSession;

  @Column()
  sessionId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ nullable: true })
  patientId: string;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.BOOKED,
  })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  bookedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

