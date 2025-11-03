'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import { UserRole, Program, Medication, Frequency } from '../../../../types';
import { Button } from '../../../../components/ui/Buttons';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Loading } from '../../../../components/ui/Loading';
import { Modal } from '../../../../components/ui/Modal';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { TextArea } from '../../../../components/ui/TextArea';

export default function ProgramMedicationsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const programId = params.programId as string;
  const [program, setProgram] = useState<Program | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [medicationForm, setMedicationForm] = useState({
    name: '',
    dose: '',
    frequency: Frequency.DAILY,
    instructions: '',
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
      const [programData, medicationsData] = await Promise.all([
        api.programs.getOne(programId),
        api.medications.getByProgram(programId),
      ]);
      setProgram(programData);
      setMedications(medicationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMedication = async () => {
    try {
      await api.medications.create({
        programId,
        ...medicationForm,
      });
      setShowModal(false);
      setMedicationForm({
        name: '',
        dose: '',
        frequency: Frequency.DAILY,
        instructions: '',
      });
      fetchData();
    } catch (error: any) {
      alert(error.message || 'Failed to create medication');
    }
  };

  if (loading) return <Loading />;
  if (user?.role !== UserRole.ADMIN) return null;
  if (!program) return <div>Program not found</div>;

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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Assign Medications</h1>
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
            Assign Medication
          </Button>
        </div>
      </div>

      {/* Medications List */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medications.map((medication) => (
          <Card key={medication.id} className="hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{medication.name}</h3>
                  <Badge variant={getFrequencyColor(medication.frequency) as any} size="sm">
                    {medication.frequency}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-semibold">Dose:</span> {medication.dose}
                </p>
                {medication.instructions && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{medication.instructions}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Assign Medication Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Assign Medication to Program"
      >
        <div className="space-y-4">
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
            onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value as Frequency })}
            options={Object.values(Frequency).map(freq => ({
              value: freq,
              label: freq.charAt(0).toUpperCase() + freq.slice(1)
            }))}
          />
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
            <Button onClick={handleCreateMedication} className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white border-0" disabled={!medicationForm.name || !medicationForm.dose}>
              Assign Medication
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

