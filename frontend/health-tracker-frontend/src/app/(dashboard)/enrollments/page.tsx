'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Enrollment, UserRole, Patient, Program, SessionRecord, AttendanceStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Buttons';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { formatDate } from '../../lib/utils';
import { useRouter } from 'next/navigation';

export default function EnrollmentsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessionsByEnrollment, setSessionsByEnrollment] = useState<Record<string, SessionRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    patientId: '',
    programId: '',
    notes: '',
  });

  useEffect(() => {
    // Redirect non-admin/staff users
    if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [user, router]);

  // Refresh data when modal opens to ensure we have latest patients and programs
  useEffect(() => {
    if (showModal) {
      // Always refresh data when modal opens to get latest patients and programs
      fetchData();
    }
  }, [showModal]);

  const fetchData = async () => {
    try {
      const [enrollmentsData, patientsData, programsData] = await Promise.all([
        api.enrollments.getAll().catch(err => {
          console.error('Error fetching enrollments:', err);
          return [];
        }),
        api.patients.getAll().catch(err => {
          console.error('Error fetching patients:', err);
          return [];
        }),
        api.programs.getAll().catch(err => {
          console.error('Error fetching programs:', err);
          return [];
        }),
      ]);
      
      setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : []);
      
      // Ensure patients is an array - show ALL patients for enrollment
      const patientsArray = Array.isArray(patientsData) ? patientsData : [];
      setPatients(patientsArray);
      
      // Show all programs, not just active ones, for enrollment
      const programsArray = Array.isArray(programsData) ? programsData : [];
      setPrograms(programsArray);
      
      // Debug logging
      console.log('Fetched patients:', patientsArray.length, patientsArray);
      console.log('Fetched programs:', programsArray.length, programsArray);
      
      // Fetch session records for each enrollment
      const sessionsMap: Record<string, SessionRecord[]> = {};
      await Promise.all(
        (Array.isArray(enrollmentsData) ? enrollmentsData : []).map(async (enrollment: Enrollment) => {
          try {
            const sessions = await api.sessions.getByEnrollment(enrollment.id);
            sessionsMap[enrollment.id] = sessions;
          } catch (error) {
            console.error(`Error fetching sessions for enrollment ${enrollment.id}:`, error);
            sessionsMap[enrollment.id] = [];
          }
        })
      );
      setSessionsByEnrollment(sessionsMap);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set empty arrays on error to prevent undefined issues
      setEnrollments([]);
      setPatients([]);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStats = (enrollmentId: string) => {
    const sessions = sessionsByEnrollment[enrollmentId] || [];
    const total = sessions.length;
    const attended = sessions.filter(s => s.status === AttendanceStatus.ATTENDED).length;
    const missed = sessions.filter(s => s.status === AttendanceStatus.MISSED).length;
    const cancelled = sessions.filter(s => s.status === AttendanceStatus.CANCELLED).length;
    const rate = total > 0 ? ((attended / total) * 100).toFixed(1) : '0';
    
    return { total, attended, missed, cancelled, rate };
  };

  const handleEnroll = async () => {
    try {
      await api.enrollments.create({
        patientId: enrollForm.patientId,
        programId: enrollForm.programId,
        enrollmentDate: new Date().toISOString().split('T')[0],
        notes: enrollForm.notes,
      });
      setShowModal(false);
      setEnrollForm({
        patientId: '',
        programId: '',
        notes: '',
      });
      fetchData();
      alert('Patient enrolled successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to enroll patient');
    }
  };


  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'success';
      case 'completed':
        return 'primary';
      case 'cancelled':
        return 'danger';
      default:
        return 'gray';
    }
  };

  // Group enrollments by patient
  const enrollmentsByPatient = enrollments.reduce((acc, enrollment) => {
    const patientId = enrollment.patient.id;
    if (!acc[patientId]) {
      acc[patientId] = {
        patient: enrollment.patient,
        enrollments: [],
      };
    }
    acc[patientId].enrollments.push(enrollment);
    return acc;
  }, {} as Record<string, { patient: Patient; enrollments: Enrollment[] }>);

  if (loading) return <Loading />;

  const isStaffOrAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.STAFF;

  return (
    <div className="space-y-6 animate-fade-in bg-gray-50 dark:bg-gray-900 min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <button
              onClick={() => router.back()}
              className="text-white/80 hover:text-white mb-2 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Manage Enrollments</h1>
            <p className="text-orange-100 dark:text-gray-300">
              View patients and their enrolled programs, manage enrollment status
            </p>
        </div>
          {isStaffOrAdmin && (
            <Button
              type="button"
              size="lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowModal(true);
              }}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-3 rounded-xl border-0"
            >
              <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Enrollment
            </Button>
        )}
        </div>
      </div>

      {/* Enrollments by Patient */}
      <div className="px-6 space-y-6">
        {Object.keys(enrollmentsByPatient).length === 0 ? (
      <Card>
          <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
              <p className="text-gray-500 text-lg dark:text-gray-400">No enrollments found</p>
              <p className="text-gray-400 text-sm mt-2 dark:text-gray-500">
                {isStaffOrAdmin ? 'Enroll patients into programs to get started' : 'No patients have been enrolled yet'}
              </p>
          </div>
          </Card>
        ) : (
          Object.values(enrollmentsByPatient).map(({ patient, enrollments: patientEnrollments }) => (
            <Card key={patient.id} className="hover:shadow-lg transition-all">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Patient Number: <span className="font-semibold">{patient.patientNumber}</span>
                  </p>
                  {patient.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Email: {patient.email}
                    </p>
                  )}
                  {patient.phoneNumber && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Phone: {patient.phoneNumber}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="info" size="lg">
                    {patientEnrollments.length} {patientEnrollments.length === 1 ? 'Program' : 'Programs'}
                  </Badge>
                </div>
              </div>

              {/* Programs List */}
              <div className="space-y-3">
                {patientEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {enrollment.program.name}
                          </h4>
                          <Badge variant={getStatusVariant(enrollment.status) as any} dot>
                            {enrollment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {enrollment.program.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-500">
                          <span>
                            📅 Enrolled: {formatDate(enrollment.enrollmentDate)}
                          </span>
                          {enrollment.completionDate && (
                            <span>
                              ✅ Completed: {formatDate(enrollment.completionDate)}
                            </span>
                          )}
                          {enrollment.program.sessionCount > 0 && (
                            <span>
                              📋 {enrollment.program.sessionCount} sessions
                            </span>
                          )}
                        </div>
                        {(() => {
                          const stats = getAttendanceStats(enrollment.id);
                          return stats.total > 0 && (
                            <div className="mt-2 flex items-center gap-4 text-xs">
                              <span className="text-gray-600 dark:text-gray-400">
                                📊 Attendance: <span className="font-semibold text-blue-600">{stats.rate}%</span>
                              </span>
                              <span className="text-green-600">✓ {stats.attended}</span>
                              <span className="text-red-600">✗ {stats.missed}</span>
                              {stats.cancelled > 0 && <span className="text-yellow-600">⚠ {stats.cancelled}</span>}
                              <span className="text-gray-500">({stats.total} total)</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    {enrollment.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">Notes:</span> {enrollment.notes}
                        </p>
                      </div>
                    )}
                    {/* Quick Actions */}
                    {isStaffOrAdmin && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => router.push(`/staff/session-attendance/${enrollment.id}`)}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          Track Sessions
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/staff/medication-dispensation/${enrollment.patient.id}`)}
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          Medications
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Enrollment Modal */}
      {isStaffOrAdmin && (
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEnrollForm({ patientId: '', programId: '', notes: '' });
          }}
          title="Enroll Patient in Program"
          size="lg"
        >
          <div className="space-y-6">
            {/* Header Info */}
            <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                  📋
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-300">Enrollment Information</p>
                  <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
                    Select a patient and the program you want to enroll them in. The patient will be able to book sessions for this program.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {patients.length === 0 ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    ⚠️ No patients available. Please create a patient first.
                  </p>
                </div>
              ) : (
                <Select
                  label="Select Patient *"
                  value={enrollForm.patientId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, patientId: e.target.value })}
                  options={[
                    { value: '', label: 'Choose a patient...' },
                    ...patients.map((p) => ({
                      value: p.id,
                      label: `${p.firstName} ${p.lastName} (${p.patientNumber})`,
                    })),
                  ]}
                />
              )}

              {enrollForm.patientId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">Selected Patient</p>
                  {(() => {
                    const selectedPatient = patients.find((p) => p.id === enrollForm.patientId);
                    if (selectedPatient) {
                      const existingPrograms = enrollments
                        .filter((e) => e.patient.id === enrollForm.patientId && e.status !== 'cancelled')
                        .map((e) => e.program.name);
                      return (
                        <div>
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            <strong>{selectedPatient.firstName} {selectedPatient.lastName}</strong>
                          </p>
                          {existingPrograms.length > 0 && (
                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                              Currently enrolled in: {existingPrograms.join(', ')}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {programs.length === 0 ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    ⚠️ No active programs available. Please create a program first.
                  </p>
                </div>
              ) : (
                <Select
                  label="Select Program *"
                  value={enrollForm.programId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, programId: e.target.value })}
                  options={[
                    { value: '', label: 'Choose a program...' },
                    ...programs.map((p) => ({
                      value: p.id,
                      label: p.name,
                    })),
                  ]}
                />
              )}

              {enrollForm.programId && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-300 mb-1">Selected Program</p>
                  {(() => {
                    const selectedProgram = programs.find((p) => p.id === enrollForm.programId);
                    if (selectedProgram) {
                      return (
                        <div>
                          <p className="text-sm text-green-700 dark:text-green-400 font-semibold mb-1">
                            {selectedProgram.name}
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-500">
                            {selectedProgram.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="info" size="sm">
                              {selectedProgram.sessionFrequency}
                            </Badge>
                            {selectedProgram.sessionTypes?.map((type, idx) => (
                              <Badge key={idx} variant="primary" size="sm" className="capitalize">
                                {type.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <TextArea
                label="Notes (Optional)"
                value={enrollForm.notes}
                onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                placeholder="Add any additional notes about this enrollment..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setEnrollForm({ patientId: '', programId: '', notes: '' });
                }}
                className="flex-1"
              >
                Cancel
                        </Button>
              <Button
                onClick={handleEnroll}
                className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white font-semibold shadow-lg hover:shadow-xl transition-all border-0"
                disabled={!enrollForm.patientId || !enrollForm.programId}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                Enroll Patient
                      </Button>
                    </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
