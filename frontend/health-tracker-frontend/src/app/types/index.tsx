// ========== src/types/index.ts (ENHANCED) ==========

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  GUEST = 'guest',
  PATIENT = 'patient', // Added patient role
}

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

export enum EnrollmentStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AttendanceStatus {
  ATTENDED = 'attended',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
  SCHEDULED = 'scheduled', // Added scheduled status
}

export enum ActivityType {
  ENROLLMENT_CREATED = 'enrollment_created',
  SESSION_RECORDED = 'session_recorded',
  MEDICATION_DISPENSED = 'medication_dispensed',
  PROGRAM_CREATED = 'program_created',
  USER_REGISTERED = 'user_registered',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  patientNumber?: string; // For patient users
}

export interface Program {
  id: string;
  name: string;
  description: string;
  sessionTypes: SessionType[];
  sessionFrequency: Frequency;
  sessionCount: number;
  isActive: boolean;
  capacity?: number; // Maximum participants
  createdAt: string;
  sessions?: ProgramSession[]; // Available sessions to book
}

// NEW: Program Sessions that patients can book
export interface ProgramSession {
  id: string;
  programId: string;
  sessionType: SessionType;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  location?: string;
  description?: string;
}

// NEW: Session Bookings by patients
export interface SessionBooking {
  id: string;
  sessionId: string;
  userId: string;
  status: 'booked' | 'attended' | 'cancelled' | 'missed';
  bookedAt: string;
  notes?: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
  dateOfBirth: string;
  gender: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  medicalHistory?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  patient: Patient;
  patientId: string;
  program: Program;
  programId: string;
  enrollmentDate: string;
  completionDate?: string;
  status: EnrollmentStatus;
  notes?: string;
  progress?: EnrollmentProgress; // NEW: Progress tracking
  createdAt: string;
}

// NEW: Enrollment Progress
export interface EnrollmentProgress {
  totalSessions: number;
  attendedSessions: number;
  missedSessions: number;
  completionRate: number;
  medicationAdherence: number;
  lastActivity: string;
}

export interface SessionRecord {
  id: string;
  enrollment: Enrollment;
  enrollmentId: string;
  sessionType: SessionType;
  scheduledDate: string;
  status: AttendanceStatus;
  notes?: string;
  cancellationReason?: string;
  recordedBy: User;
  recordedById: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: Frequency;
  instructions?: string;
  program?: Program;
  programId?: string;
  patientId?: string; // NEW: Direct patient assignment
  patient?: Patient;
  isActive: boolean;
  prescribedBy?: User; // NEW: Who prescribed it
  prescribedById?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface Dispensation {
  id: string;
  enrollment?: Enrollment;
  enrollmentId?: string;
  medication: Medication;
  medicationId: string;
  patient?: Patient; // NEW: Direct patient reference
  patientId?: string;
  dispensedDate: string;
  quantity: number;
  notes?: string;
  dispensedBy: User;
  dispensedById: string;
  nextDueDate?: string; // NEW: When next dose is due
  createdAt: string;
}

// NEW: Activity Log for audit trail
export interface ActivityLog {
  id: string;
  type: ActivityType;
  userId: string;
  user: User;
  targetId: string; // ID of the affected entity
  targetType: string; // Type of entity (enrollment, session, etc.)
  description: string;
  metadata?: any;
  createdAt: string;
}

// NEW: Dashboard Statistics
export interface DashboardStats {
  patients: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  programs: {
    total: number;
    active: number;
  };
  enrollments: {
    total: number;
    ongoing: number;
    completed: number;
  };
  sessions: {
    total: number;
    attended: number;
    missed: number;
    attendanceRate: string;
    upcomingToday: number;
  };
  medications: {
    total: number;
    dispensedToday: number;
    overdue: number;
  };
  dispensations: {
    total: number;
  };
}

// NEW: Chart Data
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

// NEW: Patient Dashboard Data
export interface PatientDashboard {
  enrollments: Enrollment[];
  upcomingSessions: ProgramSession[];
  myBookings: SessionBooking[];
  medications: Medication[];
  nextMedicationDue?: {
    medication: Medication;
    dueDate: string;
  };
  progressSummary: {
    sessionsAttended: number;
    medicationAdherence: number;
  };
}

// NEW: Alert
export interface Alert {
  id: string;
  type: 'overdue_session' | 'overdue_medication' | 'missed_session' | 'low_adherence';
  severity: 'low' | 'medium' | 'high';
  message: string;
  patientId?: string;
  patient?: Patient;
  enrollmentId?: string;
  createdAt: string;
  acknowledged: boolean;
}