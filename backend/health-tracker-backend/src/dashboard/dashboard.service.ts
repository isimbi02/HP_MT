// ========== dashboard/dashboard.service.ts ==========
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';
import { Enrollment, EnrollmentStatus } from '../enrollments/entities/enrollment.entity';
import { SessionRecord, AttendanceStatus } from '../sessions/entities/session-record.entity';
import { Dispensation } from '../dispensations/entities/dispensation.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Program } from '../programs/entities/program.entity';
import { ProgramSession } from '../program-sessions/entities/program-sessions.entity';
import { SessionBooking, BookingStatus } from '../session-bookings/entities/session-booking.entity';
import { Medication } from '../medications/entities/medication.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Frequency } from '../medications/dto/medication.dto';
import { startOfDay, subDays, format, addDays, startOfMonth, endOfMonth, startOfWeek } from 'date-fns';

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
    @InjectRepository(ProgramSession)
    private programSessionsRepository: Repository<ProgramSession>,
    @InjectRepository(SessionBooking)
    private bookingsRepository: Repository<SessionBooking>,
    @InjectRepository(Medication)
    private medicationsRepository: Repository<Medication>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
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
        relations: ['enrollment', 'enrollment.patient', 'patient', 'medication', 'dispensedBy'],
        take: 50, // Get more to filter duplicates
        order: { createdAt: 'DESC' },
      }),
    ]);

    // Filter duplicate dispensations based on medication frequency
    const filteredDispensations = this.filterDuplicateDispensations(recentDispensations);
    
    // Debug: Log filtering results
    console.log(`[Dashboard] Filtered ${recentDispensations.length} dispensations to ${filteredDispensations.length} unique entries`);

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
      recentDispensations: filteredDispensations.slice(0, 10).map((dispensation) => ({
        id: dispensation.id,
        patient: dispensation.patient
          ? `${dispensation.patient.firstName} ${dispensation.patient.lastName}`
          : `${dispensation.enrollment.patient.firstName} ${dispensation.enrollment.patient.lastName}`,
        medication: dispensation.medication.name,
        dose: dispensation.medication.dose,
        quantity: dispensation.quantity,
        dispensedDate: dispensation.dispensedDate,
        dispensedBy: `${dispensation.dispensedBy.firstName} ${dispensation.dispensedBy.lastName}`,
        createdAt: dispensation.createdAt,
      })),
    };
  }

  private filterDuplicateDispensations(dispensations: Dispensation[]): Dispensation[] {
    if (!dispensations || dispensations.length === 0) {
      return [];
    }

    // Group dispensations by medication, patient, and frequency period
    // Reverse array to process from oldest to newest, so we keep the FIRST (oldest) dispensation
    const reversed = [...dispensations].reverse();
    const seen = new Map<string, Dispensation>();

    for (const dispensation of reversed) {
      // Get patient ID - try direct patientId first, then enrollment.patient
      const patientId = dispensation.patientId || 
                       (dispensation.enrollment?.patient?.id) || 
                       (dispensation.enrollment?.patientId);
      
      const medicationId = dispensation.medicationId;
      const medication = dispensation.medication;
      const frequency = medication?.frequency;
      
      // Handle dispensedDate - it might be a Date object or string
      let dispensedDate: Date;
      if (dispensation.dispensedDate instanceof Date) {
        dispensedDate = dispensation.dispensedDate;
      } else if (typeof dispensation.dispensedDate === 'string') {
        dispensedDate = new Date(dispensation.dispensedDate);
      } else {
        // Fallback to createdAt if dispensedDate is invalid
        dispensedDate = dispensation.createdAt instanceof Date 
          ? dispensation.createdAt 
          : new Date(dispensation.createdAt);
      }

      // If we can't determine the key, include it as-is
      if (!patientId || !medicationId || !frequency) {
        const key = `${medicationId}-${patientId}-${dispensation.id}`;
        if (!seen.has(key)) {
          seen.set(key, dispensation);
        }
        continue;
      }

      // Create a key based on frequency period
      let periodKey: string;
      
      try {
        if (frequency === Frequency.DAILY) {
          // Group by day - use date string format for consistent key
          const dayStart = startOfDay(dispensedDate);
          const dateStr = dayStart.toISOString().split('T')[0]; // YYYY-MM-DD format
          periodKey = `${medicationId}-${patientId}-${dateStr}`;
        } else if (frequency === Frequency.WEEKLY) {
          // Group by week
          const weekStart = startOfWeek(dispensedDate, { weekStartsOn: 1 }); // Monday
          const dateStr = weekStart.toISOString().split('T')[0];
          periodKey = `${medicationId}-${patientId}-${dateStr}`;
        } else if (frequency === Frequency.MONTHLY) {
          // Group by month
          const monthStart = startOfMonth(dispensedDate);
          const dateStr = monthStart.toISOString().split('T')[0];
          periodKey = `${medicationId}-${patientId}-${dateStr}`;
        } else {
          // Unknown frequency, include all
          periodKey = `${medicationId}-${patientId}-${dispensation.id}`;
        }
      } catch (error) {
        // If date parsing fails, use unique key
        periodKey = `${medicationId}-${patientId}-${dispensation.id}`;
      }

      // Only keep the FIRST (oldest) dispensation for each period
      // Since we reversed the array, the first one we encounter is the oldest
      if (!seen.has(periodKey)) {
        seen.set(periodKey, dispensation);
      }
    }

    // Convert back to array and sort by createdAt DESC for display
    return Array.from(seen.values()).sort((a, b) => {
      const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }

  async getPatientDashboard(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Find patient by matching email (if user is a patient/guest, their email might match a patient email)
    let patient = await this.patientsRepository.findOne({
      where: { email: user.email },
    });

    // If not found by email, try to find via bookings (if user has bookings, they might have a patientId)
    if (!patient) {
      const bookingWithPatient = await this.bookingsRepository.findOne({
        where: { userId },
        relations: ['patient'],
      });
      if (bookingWithPatient?.patient) {
        patient = bookingWithPatient.patient;
      }
    }

    // If still not found, try matching by firstName and lastName
    if (!patient) {
      patient = await this.patientsRepository.findOne({
        where: { 
          firstName: user.firstName,
          lastName: user.lastName 
        },
      });
    }

    // Get patient's enrollments (if patient found)
    const enrollments = patient
      ? await this.enrollmentsRepository.find({
          where: { patientId: patient.id },
          relations: ['patient', 'program', 'sessionRecords'],
          order: { enrollmentDate: 'DESC' },
        })
      : [];

    // Get upcoming sessions available for booking
    const today = startOfDay(new Date());
    const upcomingSessions = await this.programSessionsRepository.find({
      where: {
        scheduledDate: MoreThanOrEqual(today),
        isActive: true,
      },
      relations: ['program'],
      order: { scheduledDate: 'ASC', startTime: 'ASC' },
      take: 20,
    });

    // Get user's bookings
    const myBookings = await this.bookingsRepository.find({
      where: { userId },
      relations: ['session', 'session.program', 'patient'],
      order: { bookedAt: 'DESC' },
    });

    // Get patient's medications (if patient found)
    const medications = patient
      ? await this.medicationsRepository.find({
          where: { patientId: patient.id, isActive: true },
          relations: ['program', 'prescribedBy'],
        })
      : [];

    // Get next medication due
    let nextMedicationDue: { medication: any; dueDate: Date } | null = null;
    if (patient) {
      const upcomingDispensations = await this.dispensationsRepository.find({
        where: { patientId: patient.id },
        relations: ['medication'],
        order: { nextDueDate: 'ASC' },
        take: 1,
      });

      if (upcomingDispensations.length > 0 && upcomingDispensations[0].nextDueDate) {
        nextMedicationDue = {
          medication: upcomingDispensations[0].medication,
          dueDate: upcomingDispensations[0].nextDueDate,
        };
      }
    }

    // Calculate progress summary
    const sessionsAttended = enrollments.reduce(
      (sum, enrollment) =>
        sum +
        enrollment.sessionRecords.filter((record) => record.status === AttendanceStatus.ATTENDED).length,
      0,
    );

    // Calculate medication adherence (simplified - can be enhanced)
    let medicationAdherence = 0;
    if (patient && medications.length > 0) {
      const totalDispensations = await this.dispensationsRepository.count({
        where: { patientId: patient.id },
      });
      // Simple calculation - can be improved
      medicationAdherence = medications.length > 0 ? Math.min(100, (totalDispensations / medications.length) * 100) : 0;
    }

    return {
      enrollments,
      upcomingSessions: upcomingSessions.filter((s) => s.bookedCount < s.capacity),
      myBookings,
      medications,
      nextMedicationDue,
      progressSummary: {
        sessionsAttended,
        medicationAdherence: Math.round(medicationAdherence),
      },
    };
  }

  async getEnhancedAlerts() {
    const today = startOfDay(new Date());
    const alerts: any[] = [];

    // Overdue sessions
    const overdueSessions = await this.sessionsRepository.find({
      where: {
        scheduledDate: LessThan(today),
        status: AttendanceStatus.MISSED,
      },
      relations: ['enrollment', 'enrollment.patient', 'enrollment.program'],
      take: 20,
    });

    overdueSessions.forEach((session) => {
      alerts.push({
        id: session.id,
        type: 'overdue_session',
        severity: 'high',
        message: `Patient ${session.enrollment.patient.firstName} ${session.enrollment.patient.lastName} missed session for ${session.enrollment.program.name}`,
        patientId: session.enrollment.patient.id,
        patient: session.enrollment.patient,
        enrollmentId: session.enrollment.id,
        createdAt: session.scheduledDate,
        acknowledged: false,
      });
    });

    // Overdue medications
    const overdueMedications = await this.dispensationsRepository
      .createQueryBuilder('dispensation')
      .leftJoinAndSelect('dispensation.medication', 'medication')
      .leftJoinAndSelect('dispensation.patient', 'patient')
      .leftJoinAndSelect('dispensation.enrollment', 'enrollment')
      .leftJoinAndSelect('enrollment.patient', 'enrollmentPatient')
      .where('dispensation.nextDueDate < :today', { today })
      .andWhere('medication.isActive = :isActive', { isActive: true })
      .getMany();

    overdueMedications.forEach((dispensation) => {
      const patient = dispensation.patient || dispensation.enrollment?.patient;
      if (patient) {
        alerts.push({
          id: dispensation.id,
          type: 'overdue_medication',
          severity: 'high',
          message: `Patient ${patient.firstName} ${patient.lastName} has overdue medication: ${dispensation.medication.name}`,
          patientId: patient.id,
          patient,
          createdAt: dispensation.nextDueDate,
          acknowledged: false,
        });
      }
    });

    // Sort by severity and date
    alerts.sort((a, b) => {
      if (a.severity === 'high' && b.severity !== 'high') return -1;
      if (a.severity !== 'high' && b.severity === 'high') return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return alerts.slice(0, 50); // Return top 50 alerts
  }

  async getChartsData() {
    // Sessions completion chart (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'yyyy-MM-dd');
    });

    const sessionsData = await Promise.all(
      last7Days.map(async (date) => {
        const dayStart = startOfDay(new Date(date));
        const dayEnd = addDays(dayStart, 1);

        const [attended, missed] = await Promise.all([
          this.sessionsRepository.count({
            where: {
              scheduledDate: MoreThanOrEqual(dayStart),
              status: AttendanceStatus.ATTENDED,
            },
          }),
          this.sessionsRepository.count({
            where: {
              scheduledDate: MoreThanOrEqual(dayStart),
              status: AttendanceStatus.MISSED,
            },
          }),
        ]);

        return { date: format(dayStart, 'MMM dd'), attended, missed };
      }),
    );

    // Medication adherence by program
    const programs = await this.programsRepository.find({
      where: { isActive: true },
    });

    const adherenceData = await Promise.all(
      programs.map(async (program) => {
        const enrollments = await this.enrollmentsRepository.find({
          where: { programId: program.id },
          relations: ['sessionRecords'],
        });

        const totalSessions = enrollments.reduce(
          (sum, e) => sum + e.sessionRecords.length,
          0,
        );
        const attendedSessions = enrollments.reduce(
          (sum, e) =>
            sum +
            e.sessionRecords.filter((r) => r.status === AttendanceStatus.ATTENDED).length,
          0,
        );

        return {
          program: program.name,
          adherenceRate: totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0,
        };
      }),
    );

    return {
      sessionsChart: {
        labels: sessionsData.map((d) => d.date),
        datasets: [
          {
            label: 'Attended',
            data: sessionsData.map((d) => d.attended),
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            borderColor: 'rgba(34, 197, 94, 1)',
          },
          {
            label: 'Missed',
            data: sessionsData.map((d) => d.missed),
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderColor: 'rgba(239, 68, 68, 1)',
          },
        ],
      },
      adherenceChart: {
        labels: adherenceData.map((d) => d.program),
        datasets: [
          {
            label: 'Adherence Rate (%)',
            data: adherenceData.map((d) => Math.round(d.adherenceRate)),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
          },
        ],
      },
    };
  }

  async exportPatientProgressReport(patientId: string): Promise<string> {
    const patient = await this.patientsRepository.findOne({ where: { id: patientId } });
    if (!patient) {
      throw new Error('Patient not found');
    }

    const enrollments = await this.enrollmentsRepository.find({
      where: { patientId },
      relations: ['program', 'sessionRecords'],
    });

    const medications = await this.medicationsRepository.find({
      where: { patientId },
      relations: ['program'],
    });

    const dispensations = await this.dispensationsRepository.find({
      where: { patientId },
      relations: ['medication'],
      order: { dispensedDate: 'DESC' },
    });

    // Generate CSV
    let csv = 'Patient Progress Report\n';
    csv += `Patient: ${patient.firstName} ${patient.lastName}\n`;
    csv += `Patient Number: ${patient.patientNumber}\n`;
    csv += `Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n\n`;

    csv += 'Program Enrollments\n';
    csv += 'Program Name,Enrollment Date,Status,Total Sessions,Attended,Missed,Completion Rate\n';
    enrollments.forEach((enrollment) => {
      const totalSessions = enrollment.sessionRecords.length;
      const attended = enrollment.sessionRecords.filter(
        (r) => r.status === AttendanceStatus.ATTENDED,
      ).length;
      const missed = enrollment.sessionRecords.filter(
        (r) => r.status === AttendanceStatus.MISSED,
      ).length;
      const completionRate = totalSessions > 0 ? ((attended / totalSessions) * 100).toFixed(2) : '0';

      csv += `${enrollment.program.name},${format(enrollment.enrollmentDate, 'yyyy-MM-dd')},${enrollment.status},${totalSessions},${attended},${missed},${completionRate}%\n`;
    });

    csv += '\nMedications\n';
    csv += 'Medication Name,Dose,Frequency,Start Date,Status\n';
    medications.forEach((medication) => {
      csv += `${medication.name},${medication.dose},${medication.frequency},${medication.startDate ? format(medication.startDate, 'yyyy-MM-dd') : 'N/A'},${medication.isActive ? 'Active' : 'Inactive'}\n`;
    });

    csv += '\nMedication Dispensations\n';
    csv += 'Medication Name,Dispensed Date,Quantity,Next Due Date\n';
    dispensations.forEach((dispensation) => {
      csv += `${dispensation.medication.name},${format(dispensation.dispensedDate, 'yyyy-MM-dd')},${dispensation.quantity},${dispensation.nextDueDate ? format(dispensation.nextDueDate, 'yyyy-MM-dd') : 'N/A'}\n`;
    });

    return csv;
  }

  async getDashboardByRole(userId: string, role: UserRole) {
    if (role === UserRole.PATIENT || role === UserRole.GUEST) {
      return this.getPatientDashboard(userId);
    } else {
      // Admin/Staff dashboard
      const [stats, alerts, recentActivity, charts] = await Promise.all([
        this.getStats(),
        this.getEnhancedAlerts(),
        this.getRecentActivity(),
        this.getChartsData(),
      ]);

      return {
        stats,
        alerts,
        recentActivity,
        charts,
      };
    }
  }
}
