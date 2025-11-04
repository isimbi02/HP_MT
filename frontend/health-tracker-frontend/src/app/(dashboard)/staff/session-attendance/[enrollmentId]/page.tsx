'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import { UserRole, Enrollment, SessionRecord, AttendanceStatus, SessionType } from '../../../../types';
import { Button } from '../../../../components/ui/Buttons';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Loading } from '../../../../components/ui/Loading';
import { Modal } from '../../../../components/ui/Modal';
import { Select } from '../../../../components/ui/Select';
import { TextArea } from '../../../../components/ui/TextArea';
import { Input } from '../../../../components/ui/Input';
import { formatDate } from '../../../../lib/utils';

export default function SessionAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const enrollmentId = params.enrollmentId as string;
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(null);
  const [sessionForm, setSessionForm] = useState({
    sessionType: SessionType.ONE_ON_ONE,
    scheduledDate: new Date().toISOString().split('T')[0],
    status: AttendanceStatus.MISSED,
    notes: '',
    cancellationReason: '',
  });

  useEffect(() => {
    if (user?.role !== UserRole.STAFF && user?.role !== UserRole.ADMIN) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [user, router, enrollmentId]);

  const fetchData = async () => {
    try {
      const [enrollmentData, sessionsData] = await Promise.all([
        api.enrollments.getOne(enrollmentId),
        api.sessions.getByEnrollment(enrollmentId),
      ]);
      setEnrollment(enrollmentData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSession = async () => {
    try {
      if (editingSession) {
        // When updating, only send fields allowed by UpdateSessionRecordDto
        await api.sessions.update(editingSession.id, {
          status: sessionForm.status,
          notes: sessionForm.notes,
          cancellationReason: sessionForm.status === AttendanceStatus.CANCELLED ? sessionForm.cancellationReason : undefined,
        });
      } else {
        // When creating, send all required fields
        await api.sessions.create({
          enrollmentId,
          sessionType: sessionForm.sessionType,
          scheduledDate: sessionForm.scheduledDate,
          status: sessionForm.status,
          notes: sessionForm.notes,
          cancellationReason: sessionForm.status === AttendanceStatus.CANCELLED ? sessionForm.cancellationReason : undefined,
        });
      }
      setShowModal(false);
      setEditingSession(null);
      setSessionForm({
        sessionType: SessionType.ONE_ON_ONE,
        scheduledDate: new Date().toISOString().split('T')[0],
        status: AttendanceStatus.MISSED,
        notes: '',
        cancellationReason: '',
      });
      fetchData();
    } catch (error: any) {
      alert(error.message || `Failed to ${editingSession ? 'update' : 'record'} session`);
    }
  };

  const handleEditSession = (session: SessionRecord) => {
    setEditingSession(session);
    setSessionForm({
      sessionType: session.sessionType,
      scheduledDate: session.scheduledDate.split('T')[0],
      status: session.status,
      notes: session.notes || '',
      cancellationReason: session.cancellationReason || '',
    });
    setShowModal(true);
  };

  const handleCancelEdit = () => {
    setShowModal(false);
    setEditingSession(null);
    setSessionForm({
      sessionType: SessionType.ONE_ON_ONE,
      scheduledDate: new Date().toISOString().split('T')[0],
      notes: '',
      cancellationReason: '',
    });
  };

  // Calculate attendance statistics
  const attendanceStats = {
    total: sessions.length,
    attended: sessions.filter(s => s.status === AttendanceStatus.ATTENDED).length,
    missed: sessions.filter(s => s.status === AttendanceStatus.MISSED).length,
    cancelled: sessions.filter(s => s.status === AttendanceStatus.CANCELLED).length,
    rate: sessions.length > 0 
      ? ((sessions.filter(s => s.status === AttendanceStatus.ATTENDED).length / sessions.length) * 100).toFixed(1)
      : '0',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended': return 'attended';
      case 'missed': return 'missed';
      case 'cancelled': return 'cancelled';
      default: return 'gray';
    }
  };

  if (loading) return <Loading />;
  if (user?.role !== UserRole.STAFF && user?.role !== UserRole.ADMIN) return null;
  if (!enrollment) return <div>Enrollment not found</div>;


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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Session Attendance</h1>
            <p className="text-blue-100 dark:text-gray-300">
              {enrollment.patient.firstName} {enrollment.patient.lastName} - {enrollment.program.name}
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowModal(true)}
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Session
          </Button>
        </div>
      </div>

      {/* Attendance Statistics */}
      {sessions.length > 0 && (
        <div className="px-6 mb-6">
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{attendanceStats.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{attendanceStats.attended}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Attended</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{attendanceStats.missed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Missed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{attendanceStats.cancelled}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cancelled</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{attendanceStats.rate}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Attendance Rate</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Sessions List */}
      <div className="px-6 space-y-4">
        {sessions.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No sessions recorded yet</p>
            </div>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    session.status === AttendanceStatus.ATTENDED ? 'bg-green-100 text-green-600' :
                    session.status === AttendanceStatus.MISSED ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {session.status === AttendanceStatus.ATTENDED ? '✓' :
                     session.status === AttendanceStatus.MISSED ? '✗' : '⚠'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 capitalize">
                        {session.sessionType.replace('_', ' ')}
                      </h3>
                      <Badge variant={getStatusColor(session.status) as any} dot>
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Scheduled: {formatDate(session.scheduledDate)}
                    </p>
                    {session.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">Notes: {session.notes}</p>
                    )}
                    {session.cancellationReason && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Reason: {session.cancellationReason}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEditSession(session)}
                  className="!bg-blue-600 hover:!bg-blue-700 !text-white border-0"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Record/Edit Session Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCancelEdit}
        title={editingSession ? "Edit Session Record" : "Record Session"}
      >
        <div className="space-y-4">
          <Select
            label="Session Type"
            value={sessionForm.sessionType}
            onChange={(e) => setSessionForm({ ...sessionForm, sessionType: e.target.value as SessionType })}
            options={Object.values(SessionType).map(type => ({
              value: type,
              label: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
            }))}
          />
          <Input
            label="Scheduled Date"
            type="date"
            value={sessionForm.scheduledDate}
            onChange={(e) => setSessionForm({ ...sessionForm, scheduledDate: e.target.value })}
          />
          <Select
            label="Status *"
            value={sessionForm.status}
            onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value as AttendanceStatus })}
            options={Object.values(AttendanceStatus).map(status => ({
              value: status,
              label: status.charAt(0).toUpperCase() + status.slice(1)
            }))}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            * Select "Missed" if the patient did not attend. This will reduce the attendance rate.
          </p>
          {sessionForm.status === AttendanceStatus.CANCELLED && (
            <Input
              label="Cancellation Reason"
              value={sessionForm.cancellationReason}
              onChange={(e) => setSessionForm({ ...sessionForm, cancellationReason: e.target.value })}
              placeholder="Enter reason for cancellation"
            />
          )}
          <TextArea
            label="Notes"
            value={sessionForm.notes}
            onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
            placeholder="Additional notes..."
            rows={3}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={handleCancelEdit} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleRecordSession} className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white border-0">
              {editingSession ? 'Update Session' : 'Record Session'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

