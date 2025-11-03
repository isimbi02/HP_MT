'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Patient, Medication, Dispensation, Frequency } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Buttons';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { TextArea } from '../ui/TextArea';
import { formatDate } from '../../lib/utils';

export function DispensationCard() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [dispensations, setDispensations] = useState<Dispensation[]>([]);
  const [medicationsAlreadyCollected, setMedicationsAlreadyCollected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [dispenseForm, setDispenseForm] = useState({
    medicationId: '',
    dispensedDate: new Date().toISOString().split('T')[0],
    quantity: 1,
    notes: '',
  });
  const [eligibilityCheck, setEligibilityCheck] = useState<any>(null);
  const [isDispensing, setIsDispensing] = useState(false);

  // Fetch patients for search
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await api.patients.getAll();
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };
    fetchPatients();
  }, []);

  const fetchPatientData = async (patientId: string) => {
    setLoading(true);
    try {
      const [medicationsData, dispensationsData] = await Promise.all([
        api.medications.getByPatient(patientId),
        api.dispensations.getByPatient(patientId),
      ]);
      setMedications(medicationsData.filter((m: Medication) => m.isActive));
      setDispensations(dispensationsData);
    } catch (error) {
      console.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkDailyMedications = useCallback(async () => {
    if (!selectedPatient) return;
    const today = new Date().toISOString().split('T')[0];
    const collectedToday = new Set<string>();

    for (const medication of medications) {
      if (medication.frequency === Frequency.DAILY) {
        try {
          const eligibility = await api.dispensations.checkEligibility({
            patientId: selectedPatient.id,
            medicationId: medication.id,
            dispensedDate: today,
          });
          if (!eligibility.eligible) {
            collectedToday.add(medication.id);
          }
        } catch (error) {
          // Silently fail
        }
      }
    }

    setMedicationsAlreadyCollected(collectedToday);
  }, [selectedPatient?.id, medications.map(m => m.id).join(',')]);

  // Fetch patient data when selected
  useEffect(() => {
    if (selectedPatient) {
      fetchPatientData(selectedPatient.id);
    } else {
      setMedications([]);
      setDispensations([]);
      setMedicationsAlreadyCollected(new Set());
    }
  }, [selectedPatient]);

  // Check which daily medications have already been collected today
  useEffect(() => {
    if (selectedPatient && medications.length > 0) {
      checkDailyMedications();
    }
  }, [selectedPatient?.id, medications.length, checkDailyMedications]);

  const checkEligibility = async (medicationId: string, date?: string) => {
    if (!selectedPatient) return;
    try {
      const result = await api.dispensations.checkEligibility({
        patientId: selectedPatient.id,
        medicationId,
        dispensedDate: date || dispenseForm.dispensedDate,
      });
      setEligibilityCheck(result);
    } catch (error: any) {
      setEligibilityCheck({ eligible: false, reason: error.message });
    }
  };

  const handleDispense = async () => {
    if (!selectedPatient) return;
    try {
      setIsDispensing(true);
      const eligibility = await api.dispensations.checkEligibility({
        patientId: selectedPatient.id,
        medicationId: dispenseForm.medicationId,
        dispensedDate: dispenseForm.dispensedDate,
      });

      if (!eligibility.eligible) {
        setEligibilityCheck(eligibility);
        setIsDispensing(false);
        return;
      }

      await api.dispensations.create({
        patientId: selectedPatient.id,
        medicationId: dispenseForm.medicationId,
        dispensedDate: dispenseForm.dispensedDate,
        quantity: dispenseForm.quantity,
        notes: dispenseForm.notes,
      });

      setShowDispenseModal(false);
      setDispenseForm({
        medicationId: '',
        dispensedDate: new Date().toISOString().split('T')[0],
        quantity: 1,
        notes: '',
      });
      setEligibilityCheck(null);
      if (selectedPatient) {
        fetchPatientData(selectedPatient.id);
      }
    } catch (error: any) {
      setEligibilityCheck({ eligible: false, reason: error.message || 'Failed to dispense medication' });
    } finally {
      setIsDispensing(false);
    }
  };

  const openDispenseModal = (medicationId: string) => {
    setDispenseForm({ ...dispenseForm, medicationId });
    setShowDispenseModal(true);
    setTimeout(() => checkEligibility(medicationId), 100);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFrequencyColor = (frequency: Frequency) => {
    switch (frequency) {
      case Frequency.DAILY: return 'success';
      case Frequency.WEEKLY: return 'info';
      case Frequency.MONTHLY: return 'warning';
      default: return 'gray';
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Medication Dispensation</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Dispense medications to patients with duplicate prevention</p>
          </div>
          <div className="w-16 h-16 rounded-xl bg-green-500 flex items-center justify-center text-3xl shadow-lg">
            💊
          </div>
        </div>

        {/* Patient Search */}
        <div className="mb-6">
          <Input
            label="Search Patient"
            placeholder="Search by name or patient number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          {searchQuery && (
            <div className="mt-2 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
              {filteredPatients.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No patients found</p>
              ) : (
                filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => {
                      setSelectedPatient(patient);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  >
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{patient.patientNumber}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected Patient Info */}
        {selectedPatient && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Patient #{selectedPatient.patientNumber}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPatient(null);
                  setMedications([]);
                  setDispensations([]);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Patient Medications */}
        {selectedPatient && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Available Medications</h3>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              </div>
            ) : medications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No medications assigned to this patient</p>
            ) : (
              <div className="space-y-3">
                {medications.map((medication) => {
                  const alreadyCollectedToday = medication.frequency === Frequency.DAILY && medicationsAlreadyCollected.has(medication.id);
                  return (
                    <div
                      key={medication.id}
                      className={`p-4 rounded-xl border ${
                        alreadyCollectedToday
                          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-bold text-gray-900 dark:text-gray-100">{medication.name}</h4>
                            <Badge variant={getFrequencyColor(medication.frequency) as any} size="sm">
                              {medication.frequency}
                            </Badge>
                            {alreadyCollectedToday && (
                              <Badge variant="warning" size="sm">Collected Today</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-semibold">Dose:</span> {medication.dose}
                          </p>
                          {alreadyCollectedToday && (
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                              ⚠️ Already collected today
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => openDispenseModal(medication.id)}
                          disabled={alreadyCollectedToday && dispenseForm.dispensedDate === new Date().toISOString().split('T')[0]}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Dispense
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Recent Dispensations */}
        {selectedPatient && dispensations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Dispensations</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {dispensations.slice(0, 5).map((dispensation) => (
                <div key={dispensation.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {dispensation.medication.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(dispensation.dispensedDate)} • Qty: {dispensation.quantity}
                      </p>
                    </div>
                    <Badge variant="success" size="sm">Dispensed</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Dispense Modal */}
      <Modal
        isOpen={showDispenseModal}
        onClose={() => {
          setShowDispenseModal(false);
          setEligibilityCheck(null);
        }}
        title="Dispense Medication"
      >
        <div className="space-y-4">
          {selectedPatient && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Patient: {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">#{selectedPatient.patientNumber}</p>
            </div>
          )}
          {dispenseForm.medicationId && (
            <>
              <Select
                label="Select Medication"
                value={dispenseForm.medicationId}
                onChange={(e) => {
                  setDispenseForm({ ...dispenseForm, medicationId: e.target.value });
                  setEligibilityCheck(null);
                  if (e.target.value) {
                    setTimeout(() => checkEligibility(e.target.value), 100);
                  }
                }}
                options={medications.map(m => ({
                  value: m.id,
                  label: `${m.name} (${m.dose}, ${m.frequency})`
                }))}
              />
              <Input
                label="Dispensed Date"
                type="date"
                value={dispenseForm.dispensedDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setDispenseForm({ ...dispenseForm, dispensedDate: newDate });
                  if (dispenseForm.medicationId) {
                    checkEligibility(dispenseForm.medicationId, newDate);
                  }
                }}
              />
              {eligibilityCheck && (
                <div className={`p-3 rounded-lg ${
                  eligibilityCheck.eligible
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {eligibilityCheck.eligible ? (
                    <p className="font-semibold text-sm">✓ Patient is eligible for this medication</p>
                  ) : (
                    <p className="font-semibold text-sm">✗ {eligibilityCheck.reason || 'Patient is not eligible'}</p>
                  )}
                </div>
              )}
              <Input
                label="Quantity"
                type="number"
                min="1"
                value={dispenseForm.quantity}
                onChange={(e) => setDispenseForm({ ...dispenseForm, quantity: parseInt(e.target.value) || 1 })}
              />
              <TextArea
                label="Notes (Optional)"
                value={dispenseForm.notes}
                onChange={(e) => setDispenseForm({ ...dispenseForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowDispenseModal(false);
                    setEligibilityCheck(null);
                  }}
                  className="flex-1"
                  disabled={isDispensing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDispense}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={!dispenseForm.medicationId || (eligibilityCheck && !eligibilityCheck.eligible) || isDispensing}
                >
                  {isDispensing ? 'Dispensing...' : 'Dispense Medication'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

