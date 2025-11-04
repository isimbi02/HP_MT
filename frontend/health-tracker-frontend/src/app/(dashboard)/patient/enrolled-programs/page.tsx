'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Enrollment, UserRole, EnrollmentStatus } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Loading } from '../../../components/ui/Loading';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/Buttons';

export default function EnrolledProgramsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== UserRole.PATIENT) {
      router.push('/dashboard');
      return;
    }
    fetchEnrollments();
  }, [user, router]);

  const fetchEnrollments = async () => {
    try {
      // Get patient dashboard data which includes enrollments
      const dashboardData = await api.dashboard.getPatientDashboard();
      
      // Use enrollments directly from dashboard data
      if (dashboardData.enrollments && dashboardData.enrollments.length > 0) {
        setEnrollments(dashboardData.enrollments);
        
        // Also try to get patient ID for potential future use
        const firstEnrollment = dashboardData.enrollments[0];
        const id = firstEnrollment.patient?.id || firstEnrollment.patientId;
        if (id) {
          setPatientId(id);
        }
      } else {
        // If no enrollments in dashboard data, set empty array
        setEnrollments([]);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-2 flex items-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">My Enrolled Programs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">View all programs you are enrolled in</p>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No enrolled programs</p>
            <p className="text-gray-400 text-sm mt-2">You are not currently enrolled in any programs</p>
            <Button
              onClick={() => router.push('/programs')}
              className="mt-4"
            >
              Browse Programs
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} hoverable className="group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors mb-1">
                    {enrollment.program?.name || 'Program'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {enrollment.program?.description || ''}
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
                  dot
                >
                  {enrollment.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Enrolled:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatDate(enrollment.enrollmentDate)}
                  </span>
                </div>
                {enrollment.completionDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Completed:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(enrollment.completionDate)}
                    </span>
                  </div>
                )}
                {enrollment.program?.sessionFrequency && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Frequency:</span>
                    <Badge variant="info" size="sm">{enrollment.program.sessionFrequency}</Badge>
                  </div>
                )}
              </div>

              {enrollment.notes && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400">{enrollment.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/programs/${enrollment.programId}`)}
                  className="w-full"
                >
                  View Program Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

