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
import { Program } from '../../programs/entities/program.entity';
import { SessionType } from '../../programs/entities/program.entity';
import { SessionBooking } from '../../session-bookings/entities/session-booking.entity';

@Entity('program_sessions')
export class ProgramSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Program, (program) => program.sessions)
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column()
  programId: string;

  @Column({
    type: 'enum',
    enum: ['one_on_one', 'group_discussion', 'consultation'],
  })
  sessionType: SessionType;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column({ default: 10 })
  capacity: number;

  @Column({ default: 0 })
  bookedCount: number;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => SessionBooking, (booking) => booking.session)
  bookings: SessionBooking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
