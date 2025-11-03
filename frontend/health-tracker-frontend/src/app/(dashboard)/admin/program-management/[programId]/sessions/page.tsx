'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../../lib/api';
import { useAuth } from '../../../../../contexts/AuthContext';
import { UserRole, Program, ProgramSession, SessionType } from '../../../../../types';
import { Button } from '../../../../../components/ui/Buttons';
import { Card } from '../../../../../components/ui/Card';
import { Badge } from '../../../../../components/ui/Badge';
import { Loading } from '../../../../../components/ui/Loading';
import { Modal } from '../../../../../components/ui/Modal';
import { Input } from '../../../../../components/ui/Input';
import { Select } from '../../../../../components/ui/Select';
import { TextArea } from '../../../../../components/ui/TextArea';
import { formatDate } from '../../../../../lib/utils';

export default function ProgramSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const programId = params.programId as string;
  const [program, setProgram] = useState<Program | null>(null);
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    sessionType: SessionType.ONE_ON_ONE,
    scheduledDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    capacity: 10,
    location: '',
    description: '',
  });

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [user, router, programId]);

  const fetchData = async () => {
    try {
      const [programData, sessionsData] = await Promise.all([
        api.programs.getOne(programId),
        api.programSessions.getAll(programId),
      ]);
      setProgram(programData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      await api.programSessions.create({
        programId,
        ...sessionForm,
      });
      setShowModal(false);
      setSessionForm({
        sessionType: SessionType.ONE_ON_ONE,
        scheduledDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        capacity: 10,
        location: '',
        description: '',
      });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to create session');
    }
  };

  if (loading) return <Loading />;
  if (user?.role !== UserRole.ADMIN) return null;
  if (!program) return <div>Program not found</div>;

  return (
    <div className="space-y-6 animate-fade-in bg-gray-50 dark:bg-gray-900 min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 mb-6">
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Manage Sessions</h1>
            <p className="text-red-100 dark:text-gray-300">{program.name}</p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowModal(true)}
            className="bg-white text-red-600 hover:bg-red-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Session
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <Card key={session.id} className="hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Badge variant="primary" size="sm" className="mb-2 capitalize">
                  {session.sessionType.replace('_', ' ')}
                </Badge>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {formatDate(session.scheduledDate)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {session.startTime} - {session.endTime}
                </p>
                {session.location && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    📍 {session.location}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Bookings:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {session.bookedCount} / {session.capacity}
                </span>
              </div>
              <Badge variant={session.bookedCount >= session.capacity ? 'danger' : 'success'} size="sm">
                {session.bookedCount >= session.capacity ? 'Full' : 'Available'}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Session Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Session"
      >
        <div className="space-y-4">
          <Select
            label="Session Type"
            value={sessionForm.sessionType}
            onChange={(e) => setSessionForm({ ...sessionForm, sessionType: e.target.value as SessionType })}
            options={program.sessionTypes.map(type => ({
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={sessionForm.startTime}
              onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              value={sessionForm.endTime}
              onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
            />
          </div>
          <Input
            label="Capacity"
            type="number"
            min="1"
            value={sessionForm.capacity}
            onChange={(e) => setSessionForm({ ...sessionForm, capacity: parseInt(e.target.value) || 10 })}
          />
          <Input
            label="Location (Optional)"
            value={sessionForm.location}
            onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
            placeholder="Session location"
          />
          <TextArea
            label="Description (Optional)"
            value={sessionForm.description}
            onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
            placeholder="Session description..."
            rows={3}
          />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleCreateSession} className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white border-0">
              Create Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

