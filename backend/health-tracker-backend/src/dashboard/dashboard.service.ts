// ========== dashboard/dashboard.service.ts ==========
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Enrollment, EnrollmentStatus } from '../enrollments/entities/enrollment.entity';
import { SessionRecord, AttendanceStatus } from '../sessions/entities/session-record.entity';
import { Dispensation } from '../dispensations/entities/dispensation.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Program } from '../programs/entities/program.entity';
import { startOfDay, subDays } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Enrollment)
    private enrollmentsRepository: Repository<Enrollment>,
    @InjectRepository(SessionRecord)
    private sessionsRepository: Repository<SessionRecord>,
    @InjectRepository(Dispensation)
    private dispensationsRepository: Repository<Dispensation>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(Program)
    private programsRepository: Repository<Program>,
  ) {}

  async getStats() {
    const [
      totalPatients,
      activePatients,
      totalPrograms,
      activePrograms,
      totalEnrollments,
      ongoingEnrollments,
      completedEnrollments,
      totalSessions,
      attendedSessions,
      missedSessions,
      totalDispensations,
    ] = await Promise.all([
      this.patientsRepository.count(),
      this.patientsRepository.count({ where: { isActive: true } }),
      this.programsRepository.count(),
      this.programsRepository.count({ where: { isActive: true } }),
      this.enrollmentsRepository.count(),
      this.enrollmentsRepository.count({ where: { status: EnrollmentStatus.ONGOING } }),
      this.enrollmentsRepository.count({ where: { status: EnrollmentStatus.COMPLETED } }),
      this.sessionsRepository.count(),
      this.sessionsRepository.count({ where: { status: AttendanceStatus.ATTENDED } }),
      this.sessionsRepository.count({ where: { status: AttendanceStatus.MISSED } }),
      this.dispensationsRepository.count(),
    ]);

    return {
      patients: {
        total: totalPatients,
        active: activePatients,
      },
      programs: {
        total: totalPrograms,
        active: activePrograms,
      },
      enrollments: {
        total: totalEnrollments,
        ongoing: ongoingEnrollments,
        completed: completedEnrollments,
      },
      sessions: {
        total: totalSessions,
        attended: attendedSessions,
        missed: missedSessions,
        attendanceRate: totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(2) : '0',
      },
      dispensations: {
        total: totalDispensations,
      },
    };
  }

  async getAlerts() {
    const today = startOfDay(new Date());
    const sevenDaysAgo = startOfDay(subDays(new Date(), 7));

    // Find sessions scheduled in the past that are not recorded
    const overdueSessions = await this.sessionsRepository.find({
      where: {
        scheduledDate: LessThan(today),
        status: AttendanceStatus.MISSED,
      },
      relations: ['enrollment', 'enrollment.patient', 'enrollment.program'],
      take: 10,
      order: { scheduledDate: 'DESC' },
    });

    // Find enrollments with no recent activity
    const inactiveEnrollments = await this.enrollmentsRepository
      .createQueryBuilder('enrollment')
      .leftJoin('enrollment.sessionRecords', 'session')
      .leftJoin('enrollment.patient', 'patient')
      .leftJoin('enrollment.program', 'program')
      .where('enrollment.status = :status', { status: EnrollmentStatus.ONGOING })
      .andWhere(
        `enrollment.id NOT IN (
          SELECT "enrollmentId" FROM session_records 
          WHERE "createdAt" > :sevenDaysAgo
        )`,
        { sevenDaysAgo },
      )
      .select([
        'enrollment',
        'patient.id',
        'patient.firstName',
        'patient.lastName',
        'program.id',
        'program.name',
      ])
      .take(10)
      .getMany();

    return {
      overdueSessions: overdueSessions.map((session) => ({
        id: session.id,
        patient: `${session.enrollment.patient.firstName} ${session.enrollment.patient.lastName}`,
        program: session.enrollment.program.name,
        scheduledDate: session.scheduledDate,
        sessionType: session.sessionType,
      })),
      inactiveEnrollments: inactiveEnrollments.map((enrollment) => ({
        id: enrollment.id,
        patient: `${enrollment.patient.firstName} ${enrollment.patient.lastName}`,
        program: enrollment.program.name,
        enrollmentDate: enrollment.enrollmentDate,
      })),
    };
  }

  async getRecentActivity() {
    const [recentSessions, recentDispensations] = await Promise.all([
      this.sessionsRepository.find({
        relations: ['enrollment', 'enrollment.patient', 'enrollment.program', 'recordedBy'],
        take: 10,
        order: { createdAt: 'DESC' },
      }),
      this.dispensationsRepository.find({
        relations: ['enrollment', 'enrollment.patient', 'medication', 'dispensedBy'],
        take: 10,
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      recentSessions: recentSessions.map((session) => ({
        id: session.id,
        patient: `${session.enrollment.patient.firstName} ${session.enrollment.patient.lastName}`,
        program: session.enrollment.program.name,
        sessionType: session.sessionType,
        status: session.status,
        scheduledDate: session.scheduledDate,
        recordedBy: `${session.recordedBy.firstName} ${session.recordedBy.lastName}`,
        createdAt: session.createdAt,
      })),
      recentDispensations: recentDispensations.map((dispensation) => ({
        id: dispensation.id,
        patient: `${dispensation.enrollment.patient.firstName} ${dispensation.enrollment.patient.lastName}`,
        medication: dispensation.medication.name,
        dose: dispensation.medication.dose,
        quantity: dispensation.quantity,
        dispensedDate: dispensation.dispensedDate,
        dispensedBy: `${dispensation.dispensedBy.firstName} ${dispensation.dispensedBy.lastName}`,
        createdAt: dispensation.createdAt,
      })),
    };
  }
}
