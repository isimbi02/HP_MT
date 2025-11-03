'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Buttons';
import { Loading } from '../ui/Loading';
import { formatDate } from '../../lib/utils';
import { UserRole, EnrollmentStatus, Program, ProgramSession, SessionBooking } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ActionCard } from '../ui/ActionCard';
import { Modal } from '../ui/Modal';
import { TextArea } from '../ui/TextArea';

export function PatientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [availableSessions, setAvailableSessions] = useState<ProgramSession[]>([]);
  const [myBookings, setMyBookings] = useState<SessionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProgramsModal, setShowProgramsModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [cancelBookingModal, setCancelBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<SessionBooking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (user?.role === UserRole.GUEST) {
        // For guests, fetch programs and sessions
        const [programsData, bookingsData] = await Promise.all([
          api.programs.getAll(),
          user?.id ? api.sessionBookings.getMyBookings() : Promise.resolve([]),
        ]);
        setPrograms(programsData.filter((p: Program) => p.isActive));
        setMyBookings(bookingsData);
        
        // Fetch sessions for all programs
        const sessionsPromises = programsData
          .filter((p: Program) => p.isActive)
          .map((p: Program) => api.programSessions.getAll(p.id).catch(() => []));
        const sessionsArrays = await Promise.all(sessionsPromises);
        const allSessions = sessionsArrays.flat();
        setAvailableSessions(allSessions.filter((s: ProgramSession) => {
          const sessionDate = new Date(s.scheduledDate);
          return sessionDate >= new Date() && s.bookedCount < s.capacity;
        }));
        setData({});
      } else if (user?.role === UserRole.PATIENT) {
        // For patients, fetch dashboard data and all programs
        const [dashboardData, programsData, bookingsData] = await Promise.all([
          api.dashboard.getPatientDashboard(),
          api.programs.getAll(),
          user?.id ? api.sessionBookings.getMyBookings() : Promise.resolve([]),
        ]);
        setData(dashboardData);
        setPrograms(programsData.filter((p: Program) => p.isActive));
        setMyBookings(bookingsData);
        
        // Get patient ID from enrollments if available
        if (dashboardData.enrollments && dashboardData.enrollments.length > 0) {
          const firstEnrollment = dashboardData.enrollments[0];
          if (firstEnrollment.patient?.id) {
            setPatientId(firstEnrollment.patient.id);
          } else if (firstEnrollment.patientId) {
            setPatientId(firstEnrollment.patientId);
          }
        }
        
        // Fetch sessions for ALL programs (not just enrolled ones) so patients can see what's available
        // They can only book if enrolled, but they can see all available sessions
        const activePrograms = programsData.filter((p: Program) => p.isActive);
        if (activePrograms.length > 0) {
          const sessionsPromises = activePrograms.map((program: Program) => 
            api.programSessions.getAll(program.id).catch(() => [])
          );
          const sessionsArrays = await Promise.all(sessionsPromises);
          const allSessions = sessionsArrays.flat();
          setAvailableSessions(allSessions.filter((s: ProgramSession) => {
            const sessionDate = new Date(s.scheduledDate);
            return sessionDate >= new Date() && s.bookedCount < s.capacity;
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

      const handleBookSession = async (sessionId: string) => {
    if (!user?.id) {
      alert('Please login to book a session');
      return;
    }
    try {
      // For patients, include both userId and patientId if available
      const bookingData: any = { sessionId, userId: user.id };
      if (user?.role === UserRole.PATIENT && patientId) {
        bookingData.patientId = patientId;
      }
      await api.sessionBookings.create(bookingData);
      // Immediately refresh bookings
      if (user?.role === UserRole.GUEST || user?.role === UserRole.PATIENT) {
        const bookingsData = await api.sessionBookings.getMyBookings();
        setMyBookings(bookingsData);
        // Close program selection and show bookings list
        setSelectedProgram(null);
        setAvailableSessions([]);
      }
      await fetchDashboardData();
      alert('Session booked successfully! Your booking will appear in admin and staff dashboards.');
    } catch (error: any) {
      alert(error.message || 'Failed to book session');
    }
  };

      const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    try {
      await api.sessionBookings.cancel(selectedBooking.id);
      setCancelBookingModal(false);
      setSelectedBooking(null);
      setCancelReason('');
      // Immediately refresh bookings for guests and patients
      if (user?.role === UserRole.GUEST || user?.role === UserRole.PATIENT) {
        const bookingsData = await api.sessionBookings.getMyBookings();
        setMyBookings(bookingsData);
      }
      await fetchDashboardData();
      alert('Booking cancelled successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel booking');
    }
  };

  const fetchProgramSessions = async (programId: string) => {
    try {
      const sessions = await api.programSessions.getAll(programId);
      const program = programs.find(p => p.id === programId);
      setSelectedProgram(program || null);
      // Filter sessions and check if already booked
      const filteredSessions = sessions.filter((s: ProgramSession) => {
        const sessionDate = new Date(s.scheduledDate);
        const isUpcoming = sessionDate >= new Date();
        const hasCapacity = s.bookedCount < s.capacity;
        return isUpcoming && hasCapacity;
      });
      setAvailableSessions(filteredSessions);
      // Open the appropriate modal based on user role
      if (user?.role === UserRole.PATIENT) {
        setShowBookingsModal(true);
      } else {
        setShowProgramsModal(true);
      }
    } catch (error) {
      console.error('Error fetching program sessions:', error);
    }
  };

  if (loading) return <Loading />;

  const getRoleInfo = () => {
    const role = user?.role || 'guest';
    switch (role) {
      case 'patient':
        return {
          title: 'Patient',
          icon: '👤',
          color: 'from-green-500 to-green-600',
          bgColor: 'from-green-50 to-green-100',
          textColor: 'text-green-700',
          description: 'Track your health programs and medications'
        };
      case 'guest':
        return {
          title: 'Guest',
          icon: '👋',
          color: 'from-gray-500 to-gray-600',
          bgColor: 'from-gray-50 to-gray-100',
          textColor: 'text-gray-700',
          description: 'View available programs'
        };
      default:
        return {
          title: 'User',
          icon: '👤',
          color: 'from-primary-500 to-primary-600',
          bgColor: 'from-primary-50 to-primary-100',
          textColor: 'text-primary-700',
          description: 'Your health dashboard'
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="space-y-6 animate-fade-in bg-gray-50 dark:bg-gray-900 min-h-screen pb-8">
      {/* Dashboard Header with Role Card */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Dashboard</h1>
            <p className="text-green-100 dark:text-gray-300">Track your programs, sessions, and medications</p>
          </div>
          
          {/* Role Display Card */}
          <div className={`bg-gradient-to-br ${roleInfo.bgColor} dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 shadow-lg border-2 border-white dark:border-gray-500 min-w-[200px]`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${roleInfo.color} flex items-center justify-center text-2xl shadow-md`}>
                {roleInfo.icon}
              </div>
              <div>
                <p className={`text-lg font-bold ${roleInfo.textColor} dark:text-gray-100 capitalize`}>{roleInfo.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{roleInfo.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Summary - Only for Patients */}
      {user?.role === UserRole.PATIENT && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6">
          <Card title="📊 Progress Summary" className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sessions Attended</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data?.progressSummary?.sessionsAttended || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Medication Adherence</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{data?.progressSummary?.medicationAdherence || 0}%</p>
              </div>
            </div>
          </Card>

          {data?.nextMedicationDue && (
            <Card title="💊 Next Medication Due" className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{data.nextMedicationDue.medication.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Due: {formatDate(data.nextMedicationDue.dueDate)}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Quick Actions for Patients/Guests */}
      <div className="px-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quick Actions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {user?.role === UserRole.GUEST ? 'Browse and book available health programs' : user?.role === UserRole.PATIENT ? 'Book sessions and manage your health programs' : 'Access your health program features'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {user?.role === UserRole.GUEST ? (
            <>
              <ActionCard
                title="Browse Programs"
                description="Explore available health programs and book sessions"
                onClick={() => setShowProgramsModal(true)}
                icon="🏥"
                color="green"
              />
              <ActionCard
                title="My Bookings"
                description={`View and manage your ${myBookings.length} booked session${myBookings.length !== 1 ? 's' : ''}`}
                onClick={() => setShowBookingsModal(true)}
                icon="📅"
                color="blue"
              />
            </>
          ) : user?.role === UserRole.PATIENT ? (
            <>
              <ActionCard
                title="Browse Programs"
                description="View all available health programs"
                onClick={() => setShowProgramsModal(true)}
                icon="🏥"
                color="green"
              />
            </>
          ) : (
            <>
              <ActionCard
                title="Browse Programs"
                description="Explore available health programs and find ones that suit your needs"
                href="/programs"
                icon="🏥"
                color="green"
              />
              <ActionCard
                title="My Medications"
                description="View your assigned medications and medication schedule"
                href="/dashboard"
                icon="💊"
                color="purple"
              />
            </>
          )}
        </div>
      </div>

      {/* Available Programs - For Patients */}
      {user?.role === UserRole.PATIENT && programs.length > 0 && (
        <Card title="🏥 Available Programs" className="mx-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Browse all available health programs. You can book sessions for programs you're enrolled in.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((program) => {
              const isEnrolled = data?.enrollments?.some((e: any) => e.programId === program.id);
              return (
                <div
                  key={program.id}
                  className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">{program.name}</h3>
                    {isEnrolled && (
                      <Badge variant="success" size="sm">Enrolled</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{program.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="info" size="sm">{program.sessionFrequency}</Badge>
                    {program.sessionTypes?.map((type, idx) => (
                      <Badge key={idx} variant="primary" size="sm" className="capitalize">{type.replace('_', ' ')}</Badge>
                    ))}
                  </div>
                  {isEnrolled && (
                    <Button
                      size="sm"
                      onClick={() => fetchProgramSessions(program.id)}
                      className="w-full !bg-blue-600 hover:!bg-blue-700 !text-white border-0"
                    >
                      Book Sessions
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* My Programs */}
      {data?.enrollments && data.enrollments.length > 0 && (
        <Card title="📋 My Enrolled Programs" className="mx-6">
          <div className="space-y-4">
            {data.enrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{enrollment.program.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Enrolled: {formatDate(enrollment.enrollmentDate)}
                    </p>
                  </div>
                  <Badge
                    variant={
                      enrollment.status === EnrollmentStatus.ONGOING
                        ? 'success'
                        : enrollment.status === EnrollmentStatus.COMPLETED
                        ? 'primary'
                        : 'warning'
                    }
                    size="lg"
                  >
                    {enrollment.status}
                  </Badge>
                </div>
                {enrollment.program.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{enrollment.program.description}</p>
                )}
                <Button
                  size="sm"
                  onClick={() => fetchProgramSessions(enrollment.programId)}
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white border-0"
                >
                  Book Sessions
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Available Sessions - For Patients */}
      {user?.role === UserRole.PATIENT && availableSessions.length > 0 && (
        <Card title="📅 Available Sessions" className="mx-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            View all available sessions. You can only book sessions for programs you're enrolled in.
          </p>
          <div className="space-y-4">
            {availableSessions.map((session: any) => {
              const isBooked = myBookings.some(b => b.sessionId === session.id && (b.status === 'booked' || b.status === 'attended'));
              // Check if patient is enrolled in this program
              const isEnrolled = data?.enrollments?.some((e: any) => e.programId === session.programId || e.program?.id === session.programId);
              const canBook = isEnrolled && !isBooked && session.bookedCount < session.capacity;
              
              return (
                <div key={session.id} className={`p-4 rounded-xl border hover:shadow-md transition-all ${
                  isEnrolled 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{session.program?.name || 'Program'}</h3>
                        <Badge variant="primary" size="sm" className="capitalize">{session.sessionType?.replace('_', ' ') || 'Session'}</Badge>
                        {isEnrolled && <Badge variant="success" size="sm">Enrolled</Badge>}
                        {!isEnrolled && <Badge variant="warning" size="sm">Not Enrolled</Badge>}
                        {isBooked && <Badge variant="success" size="sm">Already Booked</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📅 {formatDate(session.scheduledDate)} • 🕐 {session.startTime} - {session.endTime}
                      </p>
                      {session.location && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">📍 {session.location}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {session.capacity - session.bookedCount} spots available
                      </p>
                      {!isEnrolled && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-semibold">
                          ⚠️ You must be enrolled in this program to book sessions
                        </p>
                      )}
                    </div>
                    {canBook && (
                      <Button
                        size="sm"
                        onClick={() => handleBookSession(session.id)}
                        disabled={session.bookedCount >= session.capacity}
                        className="!bg-blue-600 hover:!bg-blue-700 !text-white border-0"
                      >
                        Book Session
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Available Sessions - For non-patients */}
      {user?.role !== UserRole.PATIENT && data?.upcomingSessions && data.upcomingSessions.length > 0 && (
        <Card title="📅 Available Sessions" className="mx-6">
          <div className="space-y-4">
            {data.upcomingSessions.map((session: any) => (
              <div key={session.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{session.program.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(session.scheduledDate)} • {session.startTime} - {session.endTime}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {session.sessionType} • {session.capacity - session.bookedCount} spots left
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleBookSession(session.id)}
                    disabled={session.bookedCount >= session.capacity}
                  >
                    Book Session
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* My Bookings */}
      {(data?.myBookings && data.myBookings.length > 0) || (myBookings.length > 0) ? (
        <Card title="📌 My Bookings" className="mx-6">
          <div className="space-y-4">
            {(data?.myBookings || myBookings).map((booking: any) => (
              <div key={booking.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{booking.session?.program?.name || 'Program'}</h3>
                      <Badge variant={booking.status === 'booked' ? 'primary' : booking.status === 'attended' ? 'success' : 'warning'}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📅 {formatDate(booking.session?.scheduledDate)} • 🕐 {booking.session?.startTime} - {booking.session?.endTime}
                    </p>
                    {booking.session?.location && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">📍 {booking.session.location}</p>
                    )}
                  </div>
                  {(user?.role === UserRole.GUEST || user?.role === UserRole.PATIENT) && booking.status === 'booked' && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setCancelBookingModal(true);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* My Medications - Only for Patients */}
      {user?.role === UserRole.PATIENT && data?.medications && data.medications.length > 0 && (
        <Card title="💊 My Medications" className="mx-6">
          <div className="space-y-4">
            {data.medications.map((medication: any) => (
              <div key={medication.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{medication.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Dose: {medication.dose} • Frequency: {medication.frequency}
                </p>
                {medication.instructions && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{medication.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Browse Programs Modal - For Guests and Patients */}
      {(user?.role === UserRole.GUEST || user?.role === UserRole.PATIENT) && (
        <Modal
          isOpen={showProgramsModal}
          onClose={() => {
            setShowProgramsModal(false);
            setSelectedProgram(null);
            setAvailableSessions([]);
          }}
          title={selectedProgram ? selectedProgram.name : "Available Programs"}
          size="lg"
        >
          <div className="space-y-6">
            {!selectedProgram ? (
              // Show Programs List
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Select a program to view available sessions
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {programs.map((program) => (
                    <Card key={program.id} className="hover:shadow-lg transition-all cursor-pointer" onClick={() => fetchProgramSessions(program.id)}>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{program.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{program.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="info" size="sm">{program.sessionFrequency}</Badge>
                        {program.sessionTypes?.map((type, idx) => (
                          <Badge key={idx} variant="primary" size="sm" className="capitalize">{type.replace('_', ' ')}</Badge>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              // Show Sessions for Selected Program
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">{selectedProgram.name}</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">{selectedProgram.description}</p>
                </div>
                {availableSessions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No available sessions for this program</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {availableSessions.map((session) => {
                      const isBooked = myBookings.some(b => b.sessionId === session.id && (b.status === 'booked' || b.status === 'attended'));
                      return (
                        <div key={session.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="primary" size="sm" className="capitalize">{session.sessionType.replace('_', ' ')}</Badge>
                                {isBooked && <Badge variant="success" size="sm">Booked</Badge>}
                              </div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{formatDate(session.scheduledDate)}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{session.startTime} - {session.endTime}</p>
                              {session.location && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">📍 {session.location}</p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {session.capacity - session.bookedCount} spots available
                              </p>
                            </div>
                            {!isBooked && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleBookSession(session.id);
                                  setShowProgramsModal(false);
                                  setSelectedProgram(null);
                                  setAvailableSessions([]);
                                }}
                                disabled={session.bookedCount >= session.capacity}
                                className="!bg-blue-600 hover:!bg-blue-700 !text-white border-0"
                              >
                                Book
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedProgram(null);
                    setAvailableSessions([]);
                  }}
                  className="w-full"
                >
                  Back to Programs
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* My Bookings Modal - For Guests and Patients */}
      {(user?.role === UserRole.GUEST || user?.role === UserRole.PATIENT) && (
        <Modal
          isOpen={showBookingsModal}
          onClose={() => {
            setShowBookingsModal(false);
            setCancelBookingModal(false);
            setSelectedBooking(null);
            setSelectedProgram(null);
            setAvailableSessions([]);
          }}
          title={myBookings.length === 0 && !selectedProgram ? (user?.role === UserRole.PATIENT ? "Book Sessions for Your Programs" : "Browse & Book Programs") : selectedProgram ? selectedProgram.name : "My Bookings"}
          size="lg"
        >
          <div className="space-y-4">
            {myBookings.length === 0 && !selectedProgram ? (
              // Show Programs List when no bookings - similar to enrollment modal
              <div className="space-y-6">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                      📅
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Book a Session</p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                        {user?.role === UserRole.PATIENT 
                          ? "Select an enrolled program below to view available sessions and book your appointment."
                          : "Select a program below to view available sessions and book your appointment."}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(user?.role === UserRole.PATIENT 
                    ? programs.filter((p: Program) => data?.enrollments?.some((e: any) => e.programId === p.id))
                    : programs
                  ).map((program) => {
                    const isEnrolled = user?.role === UserRole.PATIENT && data?.enrollments?.some((e: any) => e.programId === program.id);
                    return (
                      <Card 
                        key={program.id} 
                        className={`hover:shadow-lg transition-all cursor-pointer ${isEnrolled ? 'border-2 border-green-500' : ''}`}
                        onClick={() => fetchProgramSessions(program.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{program.name}</h3>
                          {isEnrolled && <Badge variant="success" size="sm">Enrolled</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{program.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="info" size="sm">{program.sessionFrequency}</Badge>
                          {program.sessionTypes?.map((type, idx) => (
                            <Badge key={idx} variant="primary" size="sm" className="capitalize">{type.replace('_', ' ')}</Badge>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : selectedProgram ? (
              // Show Sessions for Selected Program
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 mb-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">{selectedProgram.name}</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">{selectedProgram.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="info" size="sm">{selectedProgram.sessionFrequency}</Badge>
                    {selectedProgram.sessionTypes?.map((type, idx) => (
                      <Badge key={idx} variant="primary" size="sm" className="capitalize">{type.replace('_', ' ')}</Badge>
                    ))}
                  </div>
                </div>
                {availableSessions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No available sessions for this program</p>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {availableSessions.map((session) => {
                      const isBooked = myBookings.some(b => b.sessionId === session.id && (b.status === 'booked' || b.status === 'attended'));
                      return (
                        <div key={session.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="primary" size="sm" className="capitalize">{session.sessionType.replace('_', ' ')}</Badge>
                                {isBooked && <Badge variant="success" size="sm">Booked</Badge>}
                              </div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{formatDate(session.scheduledDate)}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{session.startTime} - {session.endTime}</p>
                              {session.location && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">📍 {session.location}</p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {session.capacity - session.bookedCount} spots available
                              </p>
                            </div>
                            {!isBooked && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  handleBookSession(session.id);
                                }}
                                disabled={session.bookedCount >= session.capacity}
                                className="!bg-blue-600 hover:!bg-blue-700 !text-white border-0"
                              >
                                Book
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedProgram(null);
                    setAvailableSessions([]);
                  }}
                  className="w-full"
                >
                  Back to Programs
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {myBookings.map((booking) => (
                  <div key={booking.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {booking.session?.program?.name || 'Program'}
                          </h4>
                          <Badge variant={
                            booking.status === 'booked' ? 'primary' :
                            booking.status === 'attended' ? 'success' :
                            booking.status === 'cancelled' ? 'warning' : 'danger'
                          } size="sm">
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {formatDate(booking.session?.scheduledDate || booking.bookedAt)} • {booking.session?.startTime} - {booking.session?.endTime}
                        </p>
                        {booking.session?.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">📍 {booking.session.location}</p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Booked: {formatDate(booking.bookedAt)}
                        </p>
                      </div>
                      {booking.status === 'booked' && new Date(booking.session?.scheduledDate || Date.now()) > new Date() && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setCancelBookingModal(true);
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancel Booking Modal */}
      {cancelBookingModal && (
        <Modal
          isOpen={cancelBookingModal}
          onClose={() => {
            setCancelBookingModal(false);
            setSelectedBooking(null);
            setCancelReason('');
          }}
          title="Cancel Booking"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to cancel this booking?
            </p>
            <TextArea
              label="Cancellation Reason (Optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Enter reason for cancellation..."
              rows={3}
            />
            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setCancelBookingModal(false);
                  setSelectedBooking(null);
                  setCancelReason('');
                }}
                className="flex-1"
              >
                Keep Booking
              </Button>
              <Button variant="danger" onClick={handleCancelBooking} className="flex-1">
                Cancel Booking
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

