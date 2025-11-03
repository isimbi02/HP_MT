'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { Program, ProgramSession, SessionBooking, UserRole, SessionType, Frequency } from '../../../types';
import { Button } from '../../../components/ui/Buttons';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Loading } from '../../../components/ui/Loading';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { TextArea } from '../../../components/ui/TextArea';
import { Select } from '../../../components/ui/Select';
import { formatDate } from '../../../lib/utils';

export default function ProgramDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const programId = params.programId as string;
  const [program, setProgram] = useState<Program | null>(null);
  const [sessions, setSessions] = useState<ProgramSession[]>([]);
  const [myBookings, setMyBookings] = useState<SessionBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<SessionBooking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    sessionTypes: [] as SessionType[],
    sessionFrequency: Frequency.DAILY,
    isActive: true,
  });

  useEffect(() => {
    fetchData();
  }, [programId]);

  const fetchData = async () => {
    try {
      const [programData, sessionsData, bookingsData] = await Promise.all([
        api.programs.getOne(programId),
        api.programSessions.getAll(programId),
        user?.id ? api.sessionBookings.getMyBookings() : Promise.resolve([]),
      ]);
      setProgram(programData);
      setSessions(sessionsData);
      setMyBookings(bookingsData);
    } catch (error) {
      console.error('Error fetching data:', error);
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
      await api.sessionBookings.create({ sessionId, userId: user.id });
      await fetchData();
      alert('Session booked successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to book session');
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    try {
      await api.sessionBookings.cancel(selectedBooking.id);
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
      await fetchData();
      alert('Booking cancelled successfully');
    } catch (error: any) {
      alert(error.message || 'Failed to cancel booking');
    }
  };

  const handleEditClick = () => {
    if (!program) return;
    setEditFormData({
      name: program.name,
      description: program.description,
      sessionTypes: program.sessionTypes || [],
      sessionFrequency: program.sessionFrequency,
      isActive: program.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdateProgram = async () => {
    if (!program) return;
    try {
      await api.programs.update(program.id, editFormData);
      setShowEditModal(false);
      await fetchData();
      alert('Program updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update program');
    }
  };

  const isSessionBooked = (sessionId: string) => {
    return myBookings.some(
      (booking) =>
        booking.sessionId === sessionId &&
        (booking.status === 'booked' || booking.status === 'attended')
    );
  };

  const getMyBooking = (sessionId: string) => {
    return myBookings.find((booking) => booking.sessionId === sessionId);
  };

  if (loading) return <Loading />;
  if (!program) return <div className="p-6">Program not found</div>;

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
              Back to Programs
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{program.name}</h1>
            <p className="text-blue-100 dark:text-gray-300">{program.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={program.isActive ? 'success' : 'gray'} size="lg">
              {program.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {user?.role === UserRole.ADMIN && (
              <Button
                size="lg"
                onClick={handleEditClick}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Program
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Available Sessions */}
      <div className="px-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Available Sessions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Book a session to attend this program
          </p>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No sessions available for this program yet</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => {
              const isBooked = isSessionBooked(session.id);
              const myBooking = getMyBooking(session.id);
              const isFull = session.bookedCount >= session.capacity;
              const isPast = new Date(session.scheduledDate) < new Date();

              return (
                <Card key={session.id} className="hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="primary" size="sm" className="capitalize">
                      {session.sessionType.replace('_', ' ')}
                    </Badge>
                    {isBooked && (
                      <Badge variant="success" size="sm">
                        Booked
                      </Badge>
                    )}
                    {isFull && !isBooked && (
                      <Badge variant="danger" size="sm">
                        Full
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {formatDate(session.scheduledDate)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {session.startTime} - {session.endTime}
                  </p>
                  {session.location && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      📍 {session.location}
                    </p>
                  )}
                  {session.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {session.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm mb-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">Availability:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {session.capacity - session.bookedCount} / {session.capacity} spots left
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {isBooked ? (
                      <>
                        {myBooking?.status === 'booked' && !isPast && (
                          <Button
                            variant="danger"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedBooking(myBooking);
                              setShowCancelModal(true);
                            }}
                          >
                            Cancel Booking
                          </Button>
                        )}
                        {myBooking?.status === 'attended' && (
                          <Badge variant="success" className="w-full justify-center py-2">
                            Attended ✓
                          </Badge>
                        )}
                        {myBooking?.status === 'cancelled' && (
                          <Badge variant="warning" className="w-full justify-center py-2">
                            Cancelled
                          </Badge>
                        )}
                        {myBooking?.status === 'missed' && (
                          <Badge variant="danger" className="w-full justify-center py-2">
                            Missed
                          </Badge>
                        )}
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleBookSession(session.id)}
                        disabled={isFull || isPast || !user}
                      >
                        {!user ? 'Login to Book' : isPast ? 'Past Session' : isFull ? 'Full' : 'Book Session'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Booking Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
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
                setShowCancelModal(false);
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

      {/* Edit Program Modal */}
      {user?.role === UserRole.ADMIN && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Program"
          size="lg"
        >
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                  ⚕️
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Update Program Information</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Modify the program details below. Changes will be saved immediately.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <Input
                label="Program Name *"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., Mental Health Support Program"
              />
              
              <TextArea
                label="Description *"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Provide a detailed description of what this program offers..."
                rows={4}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Session Types (Select at least one) *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.values(SessionType).map((type) => {
                    const isSelected = editFormData.sessionTypes.includes(type);
                    return (
                      <label
                        key={type}
                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditFormData({ ...editFormData, sessionTypes: [...editFormData.sessionTypes, type] });
                            } else {
                              setEditFormData({ ...editFormData, sessionTypes: editFormData.sessionTypes.filter(t => t !== type) });
                            }
                          }}
                          className="sr-only"
                        />
                        <span className="text-2xl mb-2">
                          {type === SessionType.ONE_ON_ONE ? '👤' : type === SessionType.GROUP_DISCUSSION ? '👥' : '🏥'}
                        </span>
                        <span className="text-sm font-medium text-center capitalize">
                          {type.replace('_', ' ')}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {editFormData.sessionTypes.length === 0 && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Please select at least one session type
                  </p>
                )}
              </div>

              <Select
                label="Session Frequency *"
                value={editFormData.sessionFrequency}
                onChange={(e) => setEditFormData({ ...editFormData, sessionFrequency: e.target.value as Frequency })}
                options={Object.values(Frequency).map(freq => ({
                  value: freq,
                  label: freq.charAt(0).toUpperCase() + freq.slice(1) + ' sessions'
                }))}
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Program is Active
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateProgram}
                className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white font-semibold shadow-lg hover:shadow-xl transition-all border-0"
                disabled={!editFormData.name || !editFormData.description || editFormData.sessionTypes.length === 0}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Update Program
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

