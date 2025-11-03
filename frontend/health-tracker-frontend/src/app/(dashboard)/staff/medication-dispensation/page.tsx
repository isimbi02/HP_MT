'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole, Patient, Medication, Frequency } from '../../../types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Buttons';
import { Badge } from '../../../components/ui/Badge';
import { Loading } from '../../../components/ui/Loading';
import { formatDate } from '../../../lib/utils';
import { useRouter } from 'next/navigation';

interface PatientWithMedications extends Patient {
  medications: Medication[];
}

export default function MedicationDispensationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientWithMedications[]>([]);
  const [loading, setLoading] = useState(true);
  const [dispensing, setDispensing] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<Record<string, { type: 'success' | 'error'; message: string }>>({});
  const [alreadyDispensed, setAlreadyDispensed] = useState<Set<string>>(new Set());
  const [dispensedToday, setDispensedToday] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.role !== UserRole.STAFF && user?.role !== UserRole.ADMIN) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [user, router]);

  const fetchData = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const [patientsData, medicationsData] = await Promise.all([
        api.patients.getAll(),
        api.medications.getAll(),
      ]);

      // Group medications by patient
      const patientsWithMedications: PatientWithMedications[] = patientsData.map((patient: Patient) => ({
        ...patient,
        medications: medicationsData.filter(
          (med: Medication) => med.patientId === patient.id && med.isActive
        ),
      })).filter((p: PatientWithMedications) => p.medications.length > 0);

      setPatients(patientsWithMedications);

      // Check eligibility for all medications
      await checkEligibilityForAll(patientsWithMedications);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const checkEligibilityForAll = async (patientsWithMedications: PatientWithMedications[]) => {
    const today = new Date().toISOString().split('T')[0];
    const dispensedSet = new Set<string>();
    const dispensedTodaySet = new Set<string>();
    const successMessages: Record<string, { type: 'success' | 'error'; message: string }> = {};

    // Check eligibility for each medication
    for (const patient of patientsWithMedications) {
      for (const medication of patient.medications) {
        try {
          const eligibility = await api.dispensations.checkEligibility({
            patientId: patient.id,
            medicationId: medication.id,
            dispensedDate: today,
          });

          const key = `${patient.id}-${medication.id}`;

          if (!eligibility.eligible) {
            // Medication already dispensed - mark as dispensed and show success message
            dispensedSet.add(key);
            dispensedTodaySet.add(key);
            
            // Set persistent success message based on frequency
            let message = 'Already dispensed';
            if (medication.frequency === Frequency.DAILY) {
              message = 'Already dispensed today';
            } else if (medication.frequency === Frequency.WEEKLY) {
              message = 'Already dispensed this week';
            } else if (medication.frequency === Frequency.MONTHLY) {
              message = 'Already dispensed this month';
            }
            successMessages[key] = { type: 'success', message };
          } else {
            // Medication is eligible - clear any previous messages for this medication
            // (in case it was dispensed before but the period has passed)
            delete successMessages[key];
          }
        } catch (error) {
          // Silently fail - assume eligible if check fails
        }
      }
    }

    // Update state - clear old messages and set new ones
    setAlreadyDispensed(dispensedSet);
    setDispensedToday(dispensedTodaySet);
    
    // Only keep messages for medications that are currently dispensed
    // This ensures messages persist even after logout/login
    setMessages(successMessages);
  };

  const handleDispense = async (patientId: string, medication: Medication) => {
    const key = `${patientId}-${medication.id}`;
    
    // Don't allow multiple simultaneous dispenses
    if (dispensing.has(key)) return;

    try {
      setDispensing(prev => new Set(prev).add(key));

      const today = new Date().toISOString().split('T')[0];

      // Check eligibility first
      const eligibility = await api.dispensations.checkEligibility({
        patientId,
        medicationId: medication.id,
        dispensedDate: today,
      });

      if (!eligibility.eligible) {
        // Determine frequency-specific message
        let message = 'Dose already taken';
        if (medication.frequency === Frequency.DAILY) {
          message = 'Daily dose already taken today';
        } else if (medication.frequency === Frequency.WEEKLY) {
          message = 'Weekly dose already taken this week';
        } else if (medication.frequency === Frequency.MONTHLY) {
          message = 'Monthly dose already taken this month';
        }
        
        setMessages(prev => ({
          ...prev,
          [key]: { type: 'error', message }
        }));
        setDispensing(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
        return;
      }

      // Dispense medication
      await api.dispensations.create({
        patientId,
        medicationId: medication.id,
        dispensedDate: today,
        quantity: 1,
      });

      // Set persistent success message based on frequency FIRST
      let successMessage = 'Already dispensed';
      if (medication.frequency === Frequency.DAILY) {
        successMessage = 'Already dispensed today';
      } else if (medication.frequency === Frequency.WEEKLY) {
        successMessage = 'Already dispensed this week';
      } else if (medication.frequency === Frequency.MONTHLY) {
        successMessage = 'Already dispensed this month';
      }

      // Update state immediately and atomically - this makes button disappear and message appear
      setMessages(prev => ({
        ...prev,
        [key]: { type: 'success', message: successMessage }
      }));
      setAlreadyDispensed(prev => new Set(prev).add(key));
      setDispensedToday(prev => new Set(prev).add(key));

      // Refresh data after a short delay to sync with backend
      // Don't show loading spinner during refresh - just update eligibility in background
      // The state we set above will persist until checkEligibilityForAll confirms it
      setTimeout(() => {
        fetchData(false);
      }, 500);

    } catch (error: any) {
      setMessages(prev => ({
        ...prev,
        [key]: { type: 'error', message: error.message || 'Failed to dispense medication' }
      }));
      // Remove from alreadyDispensed if error occurred
      setAlreadyDispensed(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    } finally {
      setDispensing(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    }
  };

  const getFrequencyMessage = (frequency: Frequency) => {
    switch (frequency) {
      case Frequency.DAILY:
        return 'Daily';
      case Frequency.WEEKLY:
        return 'Weekly';
      case Frequency.MONTHLY:
        return 'Monthly';
      default:
        return frequency;
    }
  };

  const getFrequencyColor = (frequency: Frequency) => {
    switch (frequency) {
      case Frequency.DAILY:
        return 'success';
      case Frequency.WEEKLY:
        return 'info';
      case Frequency.MONTHLY:
        return 'warning';
      default:
        return 'gray';
    }
  };

  if (loading) return <Loading />;
  if (user?.role !== UserRole.STAFF && user?.role !== UserRole.ADMIN) return null;

  return (
    <div className="space-y-6 animate-fade-in bg-gray-50 dark:bg-gray-900 min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 mb-6">
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Medication Dispensation</h1>
            <p className="text-green-100 dark:text-gray-300">Dispense medications to patients with automatic duplicate prevention</p>
          </div>
        </div>
      </div>

      {/* Patients and Medications */}
      <div className="px-6 space-y-6">
        {patients.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-black dark:text-white text-lg font-medium">No patients with medications found</p>
            </div>
          </Card>
        ) : (
          patients.map((patient) => (
            <Card key={patient.id}>
              <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {patient.firstName} {patient.lastName}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Patient #{patient.patientNumber}</p>
                  </div>
                  <Badge variant="primary" size="sm">
                    {patient.medications.length} Medication{patient.medications.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                {patient.medications.map((medication) => {
                  const key = `${patient.id}-${medication.id}`;
                  const isDispensingMed = dispensing.has(key);
                  const message = messages[key];
                  const isAlreadyDispensed = alreadyDispensed.has(key);

                  return (
                    <div
                      key={medication.id}
                      className={`p-4 rounded-xl border ${
                        isAlreadyDispensed
                          ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">{medication.name}</h3>
                            <Badge variant={getFrequencyColor(medication.frequency) as any} size="sm">
                              {getFrequencyMessage(medication.frequency)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <span className="font-semibold">Dose:</span> {medication.dose}
                          </p>
                          {message && (
                            <div className={`mt-2 p-2 rounded-lg ${
                              message.type === 'success'
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            }`}>
                              <p className="text-sm font-medium">
                                {message.type === 'success' ? '✓' : '✗'} {message.message}
                              </p>
                            </div>
                          )}
                          {isAlreadyDispensed && !message && (
                            <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                              <p className="text-sm font-medium">
                                ✓ {isDispensingMed ? 'Dispensing...' : (() => {
                                  if (medication.frequency === Frequency.DAILY) {
                                    return 'Already dispensed today';
                                  } else if (medication.frequency === Frequency.WEEKLY) {
                                    return 'Already dispensed this week';
                                  } else if (medication.frequency === Frequency.MONTHLY) {
                                    return 'Already dispensed this month';
                                  }
                                  return 'Already dispensed';
                                })()}
                              </p>
                            </div>
                          )}
                        </div>
                        {!isAlreadyDispensed && !isDispensingMed && (
                          <Button
                            size="sm"
                            onClick={() => handleDispense(patient.id, medication)}
                            className="bg-green-600 hover:bg-green-700 text-white ml-4"
                          >
                            Dispense
                          </Button>
                        )}
                        {isDispensingMed && !isAlreadyDispensed && (
                          <div className="ml-4 flex items-center text-sm text-gray-600 dark:text-gray-400">
                            Dispensing...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

