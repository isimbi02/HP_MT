// import { SessionType } from '../../enums/session-type.enum';


// @Entity('program_sessions')
// export class ProgramSession {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @ManyToOne(() => Program)
//   @JoinColumn({ name: 'programId' })
//   program: Program;

//   @Column()
//   programId: string;

//   @Column({ type: 'enum', enum: SessionType })
//   sessionType: SessionType;

//   @Column({ type: 'date' })
//   scheduledDate: Date;

//   @Column()
//   startTime: string;

//   @Column()
//   endTime: string;

//   @Column({ default: 10 })
//   capacity: number;

//   @Column({ default: 0 })
//   bookedCount: number;

//   @Column({ nullable: true })
//   location: string;

//   @Column({ type: 'text', nullable: true })
//   description: string;

//   @CreateDateColumn()
//   createdAt: Date;
// }