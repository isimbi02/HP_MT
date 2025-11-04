'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { Medication, UserRole, Patient, Program } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Buttons';
import { Card } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { formatEnumValue } from '../../lib/utils';
import { Frequency } from '../../types';

export default function MedicationsPage() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medicationToDelete, setMedicationToDelete] = useState<Medication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignType, setAssignType] = useState<'program' | 'patient'>('program');
  const [medicationForm, setMedicationForm] = useState({
    name: '',
    dose: '',
    frequency: 'daily' as any,
    instructions: '',
    programId: '',
    patientId: '',
    startDate: '',
    endDate: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [medicationsData, patientsData, programsData] = await Promise.all([
        api.medications.getAll(),
        user?.role === UserRole.ADMIN ? api.patients.getAll() : Promise.resolve([]),
        user?.role === UserRole.ADMIN ? api.programs.getAll() : Promise.resolve([]),
      ]);
      setMedications(medicationsData);
      setPatients(patientsData);
      setPrograms(programsData.filter((p: Program) => p.isActive));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.medications.create({
        name: medicationForm.name,
        dose: medicationForm.dose,
        frequency: medicationForm.frequency,
        instructions: medicationForm.instructions,
        programId: assignType === 'program' ? medicationForm.programId : undefined,
        patientId: assignType === 'patient' ? medicationForm.patientId : undefined,
        startDate: medicationForm.startDate || undefined,
        endDate: medicationForm.endDate || undefined,
      });
      setShowModal(false);
      setMedicationForm({
        name: '',
        dose: '',
        frequency: 'daily',
        instructions: '',
        programId: '',
        patientId: '',
        startDate: '',
        endDate: '',
      });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to create medication');
    }
  };

  const handleDeleteClick = (medication: Medication) => {
    setMedicationToDelete(medication);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!medicationToDelete) return;
    
    try {
      setIsDeleting(true);
      await api.medications.delete(medicationToDelete.id);
      setShowDeleteModal(false);
      setMedicationToDelete(null);
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Error deleting medication');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setMedicationToDelete(null);
  };

  return (
    <div className="space-y-6 animate-fade-in bg-gray-50 dark:bg-gray-900 min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 mb-6">
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Medications</h1>
            <p className="text-purple-100 dark:text-gray-300">
              {user?.role === UserRole.ADMIN ? 'Manage medications and assignments' : 'View available medications'}
            </p>
          </div>
          {user?.role === UserRole.ADMIN && (
            <Button
              size="lg"
              onClick={() => setShowModal(true)}
              className="!bg-blue-600 hover:!bg-blue-700 !text-white border-0"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Assign Medication
            </Button>
          )}
        </div>
      </div>

      <div className="px-6">
        <Card>
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : medications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No medications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black dark:text-white font-semibold">Name</TableHead>
                  <TableHead className="text-black dark:text-white font-semibold">Dose</TableHead>
                  <TableHead className="text-black dark:text-white font-semibold">Frequency</TableHead>
                  <TableHead className="text-black dark:text-white font-semibold">Program</TableHead>
                  {user?.role === UserRole.ADMIN && (
                    <TableHead className="text-black dark:text-white font-semibold">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.map((medication) => (
                  <TableRow key={medication.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <TableCell>
                      <span className="font-semibold text-black dark:text-white text-base">{medication.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-black dark:text-white">{medication.dose}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-black dark:text-white">{formatEnumValue(medication.frequency)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-black dark:text-white">{medication.program?.name || 'N/A'}</span>
                    </TableCell>
                    {user?.role === UserRole.ADMIN && (
                      <TableCell>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteClick(medication)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Are you sure you want to delete this medication?
              </h3>
              {medicationToDelete && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Name:</span> {medicationToDelete.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Dose:</span> {medicationToDelete.dose}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                This action cannot be undone. The medication will be permanently removed from the system.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleDeleteCancel}
              className="flex-1"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              className="flex-1"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Medication'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Medication Modal */}
      {user?.role === UserRole.ADMIN && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Assign Medication"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Assign To
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAssignType('program')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    assignType === 'program'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold">Program</span>
                  <p className="text-xs mt-1">Assign to a program</p>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignType('patient')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    assignType === 'patient'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="font-semibold">Patient</span>
                  <p className="text-xs mt-1">Assign to a patient</p>
                </button>
              </div>
            </div>
            <Input
              label="Medication Name"
              value={medicationForm.name}
              onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
              placeholder="e.g., Aspirin"
            />
            <Input
              label="Dose"
              value={medicationForm.dose}
              onChange={(e) => setMedicationForm({ ...medicationForm, dose: e.target.value })}
              placeholder="e.g., 100mg"
            />
            <Select
              label="Frequency"
              value={medicationForm.frequency}
              onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
              options={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
            {assignType === 'program' && (
              <Select
                label="Program (Optional)"
                value={medicationForm.programId}
                onChange={(e) => setMedicationForm({ ...medicationForm, programId: e.target.value })}
                options={[
                  { value: '', label: 'Select Program (Optional)' },
                  ...programs.map(p => ({ value: p.id, label: p.name }))
                ]}
              />
            )}
            {assignType === 'patient' && (
              <Select
                label="Patient"
                value={medicationForm.patientId}
                onChange={(e) => setMedicationForm({ ...medicationForm, patientId: e.target.value })}
                options={[
                  { value: '', label: 'Select Patient' },
                  ...patients.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.patientNumber})` }))
                ]}
              />
            )}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date (Optional)"
                type="date"
                value={medicationForm.startDate}
                onChange={(e) => setMedicationForm({ ...medicationForm, startDate: e.target.value })}
              />
              <Input
                label="End Date (Optional)"
                type="date"
                value={medicationForm.endDate}
                onChange={(e) => setMedicationForm({ ...medicationForm, endDate: e.target.value })}
              />
            </div>
            <TextArea
              label="Instructions (Optional)"
              value={medicationForm.instructions}
              onChange={(e) => setMedicationForm({ ...medicationForm, instructions: e.target.value })}
              placeholder="Medication instructions..."
              rows={3}
            />
            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
            <Button
              onClick={handleCreate}
              className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white border-0"
              disabled={!medicationForm.name || !medicationForm.dose || (assignType === 'patient' && !medicationForm.patientId)}
            >
              Assign Medication
            </Button>
            </div>
          </div>
        </Modal>
      )}
      </div>
    </div>
  );
}