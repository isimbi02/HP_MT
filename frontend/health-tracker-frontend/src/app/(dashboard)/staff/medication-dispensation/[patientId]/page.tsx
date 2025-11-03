'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import { UserRole, Medication, Dispensation, Patient, Frequency } from '../../../../types';
import { Button } from '../../../../components/ui/Buttons';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Loading } from '../../../../components/ui/Loading';
import { Modal } from '../../../../components/ui/Modal';
import { Select } from '../../../../components/ui/Select';
import { Input } from '../../../../components/ui/Input';
import { TextArea } from '../../../../components/ui/TextArea';
import { formatDate } from '../../../../lib/utils';

export default function MedicationDispensationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [dispensations, setDispensations] = useState<Dispensation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [dispenseForm, setDispenseForm] = useState({
    medicationId: '',
    dispensedDate: new Date().toISOString().split('T')[0],
    quantity: 1,
    notes: '',
  });
  const [eligibilityCheck, setEligibilityCheck] = useState<any>(null);
  const [medicationsAlreadyCollected, setMedicationsAlreadyCollected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.role !== UserRole.STAFF && user?.role !== UserRole.ADMIN) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [user, router, patientId]);

  // Check which daily medications have already been collected today
  useEffect(() => {
    const checkDailyMedications = async () => {
      const today = new Date().toISOString().split('T')[0];
      const collectedToday = new Set<string>();

      for (const medication of medications) {
        if (medication.frequency === Frequency.DAILY) {
          try {
            const eligibility = await api.dispensations.checkEligibility({
              patientId,
              medicationId: medication.id,
              dispensedDate: today,
            });
            if (!eligibility.eligible) {
              collectedToday.add(medication.id);
            }
          } catch (error) {
            // Silently fail eligibility check for list display
          }
        }
      }

      setMedicationsAlreadyCollected(collectedToday);
    };

    if (medications.length > 0 && patientId) {
      checkDailyMedications();
    }
  }, [medications, patientId]);

  const fetchData = async () => {
    try {
      const [patientData, medicationsData, dispensationsData] = await Promise.all([
        api.patients.getOne(patientId),
        api.medications.getByPatient(patientId),
        api.dispensations.getByPatient(patientId),
      ]);
      setPatient(patientData);
      setMedications(medicationsData.filter((m: Medication) => m.isActive));
      setDispensations(dispensationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (medicationId: string, date?: string) => {
    try {
      const medication = medications.find(m => m.id === medicationId);
      if (!medication) return;

      const result = await api.dispensations.checkEligibility({
        patientId,
        medicationId,
        dispensedDate: date || dispenseForm.dispensedDate,
      });
      setEligibilityCheck(result);
    } catch (error: any) {
      setEligibilityCheck({ eligible: false, reason: error.message });
    }
  };

  const handleDispense = async () => {
    try {
      const medication = medications.find(m => m.id === dispenseForm.medicationId);
      if (!medication) return;

      // Check eligibility before dispensing
      const eligibility = await api.dispensations.checkEligibility({
        patientId,
        medicationId: dispenseForm.medicationId,
        dispensedDate: dispenseForm.dispensedDate,
      });

      if (!eligibility.eligible) {
        // Show error in the eligibility check UI instead of alert
        setEligibilityCheck(eligibility);
        return;
      }

      await api.dispensations.create({
        patientId,
        medicationId: dispenseForm.medicationId,
        dispensedDate: dispenseForm.dispensedDate,
        quantity: dispenseForm.quantity,
        notes: dispenseForm.notes,
      });

      setShowModal(false);
      setDispenseForm({
        medicationId: '',
        dispensedDate: new Date().toISOString().split('T')[0],
        quantity: 1,
        notes: '',
      });
      setEligibilityCheck(null);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to dispense medication');
    }
  };

  if (loading) return <Loading />;
  if (user?.role !== UserRole.STAFF && user?.role !== UserRole.ADMIN) return null;
  if (!patient) return <div>Patient not found</div>;

  const getFrequencyColor = (frequency: Frequency) => {
    switch (frequency) {
      case Frequency.DAILY: return 'success';
      case Frequency.WEEKLY: return 'info';
      case Frequency.MONTHLY: return 'warning';
      default: return 'gray';
    }
  };

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
            <p className="text-green-100 dark:text-gray-300">
              {patient.firstName} {patient.lastName} ({patient.patientNumber})
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowModal(true)}
            className="!bg-green-600 hover:!bg-green-700 !text-white border-0"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Dispense Medication
          </Button>
        </div>
      </div>

      {/* Patient Medications */}
      <div className="px-6">
        <Card title="Patient Medications" subtitle="Current medications assigned to patient">
          <div className="space-y-4">
            {medications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No medications assigned</p>
            ) : (
              medications.map((medication) => {
                const alreadyCollectedToday = medication.frequency === Frequency.DAILY && medicationsAlreadyCollected.has(medication.id);
                return (
                  <div 
                    key={medication.id} 
                    className={`p-4 rounded-xl border ${
                      alreadyCollectedToday
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{medication.name}</h3>
                          <Badge variant={getFrequencyColor(medication.frequency) as any} size="sm">
                            {medication.frequency}
                          </Badge>
                          {alreadyCollectedToday && (
                            <Badge variant="warning" size="sm">
                              Collected Today
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span className="font-semibold">Dose:</span> {medication.dose}
                        </p>
                        {alreadyCollectedToday && (
                          <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium mt-2">
                            ⚠️ This daily medication has already been collected today
                          </p>
                        )}
                        {medication.instructions && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{medication.instructions}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Dispensation History */}
      <div className="px-6">
        <Card title="Dispensation History" subtitle="Record of all medication collections">
          <div className="space-y-4">
            {dispensations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No dispensations yet</p>
            ) : (
              dispensations.map((dispensation) => (
                <div key={dispensation.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400">
                        💊
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {dispensation.medication.name}
                          </h3>
                          <Badge variant="success" size="sm">Dispensed</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span className="font-semibold">Date:</span> {formatDate(dispensation.dispensedDate)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">Quantity:</span> {dispensation.quantity}
                        </p>
                        {dispensation.nextDueDate && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                            Next due: {formatDate(dispensation.nextDueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Dispense Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEligibilityCheck(null);
        }}
        title="Dispense Medication"
      >
        <div className="space-y-4">
          <Select
            label="Select Medication"
            value={dispenseForm.medicationId}
            onChange={(e) => {
              setDispenseForm({ ...dispenseForm, medicationId: e.target.value });
              setEligibilityCheck(null);
              // Automatically check eligibility when medication is selected
              if (e.target.value) {
                setTimeout(() => checkEligibility(e.target.value), 100);
              }
            }}
            options={medications.map(m => ({
              value: m.id,
              label: `${m.name} (${m.dose}, ${m.frequency})`
            }))}
          />
          {dispenseForm.medicationId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => checkEligibility(dispenseForm.medicationId)}
              className="w-full"
            >
              Check Eligibility
            </Button>
          )}
          {eligibilityCheck && (
            <div className={`p-3 rounded-lg ${
              eligibilityCheck.eligible
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {eligibilityCheck.eligible ? (
                <p className="font-semibold">✓ Patient is eligible for this medication</p>
              ) : (
                <p className="font-semibold">✗ {eligibilityCheck.reason || 'Patient is not eligible'}</p>
              )}
            </div>
          )}
          <Input
            label="Dispensed Date"
            type="date"
            value={dispenseForm.dispensedDate}
            onChange={(e) => {
              const newDate = e.target.value;
              setDispenseForm({ ...dispenseForm, dispensedDate: newDate });
              // Re-check eligibility when date changes
              if (dispenseForm.medicationId) {
                checkEligibility(dispenseForm.medicationId, newDate);
              }
            }}
          />
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={dispenseForm.quantity}
            onChange={(e) => setDispenseForm({ ...dispenseForm, quantity: parseInt(e.target.value) || 1 })}
          />
          <TextArea
            label="Notes"
            value={dispenseForm.notes}
            onChange={(e) => setDispenseForm({ ...dispenseForm, notes: e.target.value })}
            placeholder="Additional notes..."
            rows={3}
          />
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setEligibilityCheck(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDispense}
              className="flex-1"
              disabled={!dispenseForm.medicationId || (eligibilityCheck && !eligibilityCheck.eligible)}
            >
              Dispense Medication
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

