'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole, Enrollment, Patient, Program, SessionRecord, AttendanceStatus } from '../../../types';
import { Button } from '../../../components/ui/Buttons';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Loading } from '../../../components/ui/Loading';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { formatDate } from '../../../lib/utils';
import { useRouter } from 'next/navigation';

export default function PatientTrackingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessionsByEnrollment, setSessionsByEnrollment] = useState<Record<string, SessionRecord[]>>({});
  const [loading, setLoading] = useState(true);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollForm, setEnrollForm] = useState({
    patientId: '',
    programId: '',
    notes: '',
  });

  useEffect(() => {
    if (user?.role !== UserRole.STAFF && user?.role !== UserRole.ADMIN) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    try {
      const [enrollmentsData, patientsData, programsData] = await Promise.all([
        api.enrollments.getAll(),
        api.patients.getAll(),
        api.programs.getAll(),
      ]);
      setEnrollments(enrollmentsData);
      setPatients(patientsData);
      setPrograms(programsData.filter((p: Program) => p.isActive));
      
      // Fetch session records for each enrollment
      const sessionsMap: Record<string, SessionRecord[]> = {};
      await Promise.all(
        enrollmentsData.map(async (enrollment: Enrollment) => {
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
      setShowEnrollModal(false);
      setEnrollForm({ patientId: '', programId: '', notes: '' });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to enroll patient');
    }
  };


  if (loading) return <Loading />;
  if (user?.role !== UserRole.STAFF && user?.role !== UserRole.ADMIN) return null;

  return (
    <div className="space-y-6 animate-fade-in bg-gray-50 dark:bg-gray-900 min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 mb-6">
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Patient Enrollment & Tracking</h1>
            <p className="text-blue-100 dark:text-gray-300">Enroll patients into programs and track their progress</p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowEnrollModal(true)}
            className="!bg-blue-600 hover:!bg-blue-700 !text-white border-0"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Enroll Patient
          </Button>
        </div>
      </div>

      {/* Enrollments List */}
      <div className="px-6 space-y-4">
        {enrollments.map((enrollment) => (
          <Card key={enrollment.id} className="hover:shadow-lg transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {enrollment.patient.firstName[0]}{enrollment.patient.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {enrollment.patient.firstName} {enrollment.patient.lastName}
                      </h3>
                      <Badge variant={
                        enrollment.status === 'ongoing' ? 'success' :
                        enrollment.status === 'completed' ? 'primary' : 'warning'
                      } dot>
                        {enrollment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span className="font-semibold">Program:</span> {enrollment.program.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Enrolled: {formatDate(enrollment.enrollmentDate)}
                      {enrollment.completionDate && ` • Completed: ${formatDate(enrollment.completionDate)}`}
                    </p>
                    {(() => {
                      const stats = getAttendanceStats(enrollment.id);
                      return stats.total > 0 && (
                        <div className="mt-3 flex items-center gap-4 text-xs">
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
              </div>
              <div className="flex gap-2">
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
            </div>
          </Card>
        ))}
      </div>

      {/* Enroll Modal */}
      <Modal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title="Enroll Patient in Program"
      >
        <div className="space-y-4">
          <Select
            label="Select Patient"
            value={enrollForm.patientId}
            onChange={(e) => setEnrollForm({ ...enrollForm, patientId: e.target.value })}
            options={patients.map(p => ({
              value: p.id,
              label: `${p.firstName} ${p.lastName} (${p.patientNumber})`
            }))}
          />
          <Select
            label="Select Program"
            value={enrollForm.programId}
            onChange={(e) => setEnrollForm({ ...enrollForm, programId: e.target.value })}
            options={programs.map(p => ({ value: p.id, label: p.name }))}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowEnrollModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleEnroll} className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white border-0" disabled={!enrollForm.patientId || !enrollForm.programId}>
              Enroll Patient
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

