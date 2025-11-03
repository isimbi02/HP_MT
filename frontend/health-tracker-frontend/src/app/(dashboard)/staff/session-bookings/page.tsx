'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { Button } from '../../../components/ui/Buttons';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Loading } from '../../../components/ui/Loading';
import { Modal } from '../../../components/ui/Modal';
import { formatDate } from '../../../lib/utils';

interface Booking {
  id: string;
  status: 'booked' | 'attended' | 'missed' | 'cancelled';
  bookedAt: string;
  notes?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    role?: string;
  };
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  session?: {
    id: string;
    sessionType: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    location?: string;
    program?: {
      id: string;
      name: string;
    };
  };
}

export default function SessionBookingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusUpdate, setStatusUpdate] = useState<'attended' | 'missed' | ''>('');

  useEffect(() => {
    if (!user) return;
    
    if (user.role !== UserRole.STAFF && user.role !== UserRole.ADMIN) {
      router.push('/dashboard');
      return;
    }
    fetchBookings();
  }, [user, router]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.sessionBookings.getAll();
      console.log('Fetched bookings:', data);
      setBookings(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      setError(error.message || 'Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedBooking || !statusUpdate) return;
    try {
      await api.sessionBookings.update(selectedBooking.id, {
        status: statusUpdate,
      });
      setShowModal(false);
      setSelectedBooking(null);
      setStatusUpdate('');
      await fetchBookings();
      alert('Attendance status updated successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  const openStatusModal = (booking: Booking) => {
    setSelectedBooking(booking);
    // If already attended or missed, set that as default; otherwise empty
    if (booking.status === 'attended' || booking.status === 'missed') {
      setStatusUpdate(booking.status);
    } else {
      setStatusUpdate('');
    }
    setShowModal(true);
  };

  const getStatusColor = (status: string): 'primary' | 'success' | 'danger' | 'warning' | 'gray' => {
    switch (status) {
      case 'booked':
        return 'primary';
      case 'attended':
        return 'success';
      case 'missed':
        return 'danger';
      case 'cancelled':
        return 'warning';
      default:
        return 'gray';
    }
  };

  const formatSessionType = (type: string | undefined): string => {
    if (!type) return 'N/A';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPersonName = (booking: Booking): string => {
    if (booking.user) {
      return `${booking.user.firstName} ${booking.user.lastName}`;
    }
    if (booking.patient) {
      return `${booking.patient.firstName} ${booking.patient.lastName}`;
    }
    return 'Unknown User';
  };

  const getPersonEmail = (booking: Booking): string | undefined => {
    return booking.user?.email || booking.patient?.email;
  };

  const getPersonRole = (booking: Booking): string => {
    if (booking.user?.role) {
      return booking.user.role === 'GUEST' ? 'Guest' : booking.user.role === 'PATIENT' ? 'Patient' : 'User';
    }
    return 'Patient';
  };

  if (loading) return <Loading />;
  if (user?.role !== UserRole.STAFF && user?.role !== UserRole.ADMIN) return null;

  // Sort bookings by scheduled date (upcoming first)
  const sortedBookings = [...bookings].sort((a, b) => {
    const dateA = a.session?.scheduledDate || a.bookedAt;
    const dateB = b.session?.scheduledDate || b.bookedAt;
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Session Bookings & Attendance</h1>
            <p className="text-blue-100 dark:text-gray-300">
              View all bookings from guests and patients, and mark attendance status
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 dark:text-gray-300 text-sm mb-1">Total Bookings</p>
            <p className="text-3xl font-bold text-white">{bookings.length}</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6">
          <Card className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <Button
              variant="primary"
              size="sm"
              onClick={fetchBookings}
              className="mt-3"
            >
              Retry
            </Button>
          </Card>
        </div>
      )}

      {/* Bookings List */}
      <div className="px-6 space-y-4">
        {sortedBookings.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No session bookings found</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                Bookings will appear here once guests or patients book sessions
              </p>
            </div>
          </Card>
        ) : (
          sortedBookings.map((booking) => {
            const personName = getPersonName(booking);
            const personEmail = getPersonEmail(booking);
            const personRole = getPersonRole(booking);

            return (
              <Card
                key={booking.id}
                className="hover:shadow-lg transition-all cursor-pointer"
                onClick={() => openStatusModal(booking)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                        {personName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {personName}
                          </h3>
                          <Badge variant="info" size="sm">{personRole}</Badge>
                          <Badge variant={getStatusColor(booking.status)} dot size="sm">
                            {booking.status}
                          </Badge>
                        </div>
                        {personEmail && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{personEmail}</p>
                        )}
                      </div>
                    </div>

                    <div className="ml-16 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="primary" size="sm" className="capitalize">
                          {formatSessionType(booking.session?.sessionType)}
                        </Badge>
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {booking.session?.program?.name || 'Program'}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          📅 <span className="font-semibold">Date:</span>{' '}
                          {formatDate(booking.session?.scheduledDate || booking.bookedAt)}
                        </p>
                        {booking.session?.startTime && booking.session?.endTime && (
                          <p>
                            ⏰ <span className="font-semibold">Time:</span>{' '}
                            {booking.session.startTime} - {booking.session.endTime}
                          </p>
                        )}
                        {booking.session?.location && (
                          <p>
                            📍 <span className="font-semibold">Location:</span> {booking.session.location}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Booked on: {formatDate(booking.bookedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button
                      variant={booking.status === 'booked' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openStatusModal(booking);
                      }}
                    >
                      {booking.status === 'booked' ? 'Mark Attendance' : 'Update Status'}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Update Attendance Status Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedBooking(null);
          setStatusUpdate('');
        }}
        title="Mark Attendance Status"
        size="lg"
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                  📋
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Session Details</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                    Select whether the {getPersonRole(selectedBooking).toLowerCase()} attended or missed this session.
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{getPersonRole(selectedBooking)}</p>
                  <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                    {getPersonName(selectedBooking)}
                  </p>
                  {getPersonEmail(selectedBooking) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getPersonEmail(selectedBooking)}
                    </p>
                  )}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Program</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    {selectedBooking.session?.program?.name || 'N/A'}
                  </p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Session Type</p>
                  <Badge variant="primary" size="sm" className="capitalize">
                    {formatSessionType(selectedBooking.session?.sessionType)}
                  </Badge>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Date & Time</p>
                  <p className="text-base text-gray-900 dark:text-gray-100">
                    {formatDate(selectedBooking.session?.scheduledDate || selectedBooking.bookedAt)}
                  </p>
                  {selectedBooking.session?.startTime && selectedBooking.session?.endTime && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedBooking.session.startTime} - {selectedBooking.session.endTime}
                    </p>
                  )}
                </div>
                {selectedBooking.session?.location && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Location</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">📍 {selectedBooking.session.location}</p>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Current Status</p>
                  <Badge variant={getStatusColor(selectedBooking.status)} dot size="sm">
                    {selectedBooking.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Mark Attendance Status *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatusUpdate('attended')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    statusUpdate === 'attended'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">✅</span>
                    <span className="font-semibold">Completed</span>
                    <span className="text-xs text-center">Patient/Guest attended the session</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusUpdate('missed')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    statusUpdate === 'missed'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">❌</span>
                    <span className="font-semibold">Missed</span>
                    <span className="text-xs text-center">Patient/Guest did not attend</span>
                  </div>
                </button>
              </div>
              {!statusUpdate && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Please select an attendance status
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowModal(false);
                  setSelectedBooking(null);
                  setStatusUpdate('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateStatus}
                className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white font-semibold shadow-lg hover:shadow-xl transition-all border-0"
                disabled={!statusUpdate || (statusUpdate !== 'attended' && statusUpdate !== 'missed')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Update Status
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
