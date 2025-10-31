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

  @ManyToOne(() => Program, (program) => program.medications)
  @JoinColumn({ name: 'programId' })
  program: Program;

  @Column()
  programId: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Dispensation, (dispensation) => dispensation.medication)
  dispensations: Dispensation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}