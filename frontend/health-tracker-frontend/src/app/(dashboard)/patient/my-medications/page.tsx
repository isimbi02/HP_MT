'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { Medication, UserRole, Frequency } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Loading } from '../../../components/ui/Loading';
import { formatDate } from '../../../lib/utils';

export default function MyMedicationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== UserRole.PATIENT) {
      router.push('/dashboard');
      return;
    }
    fetchMedications();
  }, [user, router]);

  const fetchMedications = async () => {
    try {
      // Get patient dashboard data which includes medications
      const dashboardData = await api.dashboard.getPatientDashboard();
      
      // Use medications directly from dashboard data
      if (dashboardData.medications && dashboardData.medications.length > 0) {
        setMedications(dashboardData.medications);
        
        // Also try to get patient ID for potential future use
        if (dashboardData.enrollments && dashboardData.enrollments.length > 0) {
          const firstEnrollment = dashboardData.enrollments[0];
          const id = firstEnrollment.patient?.id || firstEnrollment.patientId;
          if (id) {
            setPatientId(id);
          }
        }
      } else {
        // If no medications in dashboard data, set empty array
        setMedications([]);
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      setMedications([]);
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">My Medications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">View your assigned medications and schedules</p>
        </div>
      </div>

      {medications.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No medications assigned</p>
            <p className="text-gray-400 text-sm mt-2">You don't have any medications assigned yet</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map((medication) => (
            <Card key={medication.id} hoverable className="group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors mb-1">
                    {medication.name}
                  </h3>
                  {medication.program && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Program: {medication.program.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Dose:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{medication.dose}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Frequency:</span>
                  <Badge variant="info" size="sm">{medication.frequency}</Badge>
                </div>
                {medication.startDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Start Date:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(medication.startDate)}
                    </span>
                  </div>
                )}
                {medication.endDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">End Date:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(medication.endDate)}
                    </span>
                  </div>
                )}
              </div>

              {medication.instructions && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">Instructions:</p>
                  <p className="text-xs text-blue-800 dark:text-blue-400">{medication.instructions}</p>
                </div>
              )}

              {medication.prescribedBy && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Prescribed by: {medication.prescribedBy.firstName} {medication.prescribedBy.lastName}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

