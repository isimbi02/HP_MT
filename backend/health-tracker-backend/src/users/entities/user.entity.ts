import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { SessionRecord } from '../../sessions/entities/session-record.entity';
import { Dispensation } from '../../dispensations/entities/dispensation.entity';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  GUEST = 'guest',
  PATIENT = 'patient'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STAFF,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => SessionRecord, (sessionRecord) => sessionRecord.recordedBy)
  recordedSessions: SessionRecord[];

  @OneToMany(() => Dispensation, (dispensation) => dispensation.dispensedBy)
  dispensedMedications: Dispensation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
