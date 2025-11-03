'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { PatientForm } from '../../../components/forms/PatientForm';
import { Card } from '../../../components/ui/Card';

export default function NewPatientPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not admin or staff
  if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.STAFF) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (formData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.patients.create(formData);
      router.push('/patients');
    } catch (err: any) {
      setError(err.message || 'Failed to create patient. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/patients');
  };

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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Create New Patient</h1>
            <p className="text-blue-100 dark:text-gray-300">Add a new patient to the system</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-6">
        <Card>
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
              </div>
            </div>
          )}
          <PatientForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
        </Card>
      </div>
    </div>
  );
}

