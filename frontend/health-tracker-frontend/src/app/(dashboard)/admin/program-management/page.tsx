'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/AuthContext';
import { UserRole, Program, SessionType, Frequency } from '../../../types';
import { Button } from '../../../components/ui/Buttons';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Loading } from '../../../components/ui/Loading';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { TextArea } from '../../../components/ui/TextArea';
import { Select } from '../../../components/ui/Select';
import { formatDate } from '../../../lib/utils';
import { useRouter } from 'next/navigation';

export default function ProgramManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sessionTypes: [] as SessionType[],
    sessionFrequency: Frequency.DAILY,
    sessionCount: 0,
  });

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      router.push('/dashboard');
      return;
    }
    fetchPrograms();
  }, [user, router]);

  const fetchPrograms = async () => {
    try {
      const data = await api.programs.getAll();
      setPrograms(data);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProgram = async () => {
    try {
      await api.programs.create(formData);
      setShowModal(false);
      setFormData({
        name: '',
        description: '',
        sessionTypes: [],
        sessionFrequency: Frequency.DAILY,
        sessionCount: 0,
      });
      fetchPrograms();
    } catch (error: any) {
      alert(error.message || 'Failed to create program');
    }
  };

  const handleAddSession = async (programId: string) => {
    router.push(`/admin/program-management/${programId}/sessions`);
  };


  if (loading) return <Loading />;
  if (user?.role !== UserRole.ADMIN) return null;

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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Program Management</h1>
            <p className="text-red-100 dark:text-gray-300">Create and manage health programs with their sessions</p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowModal(true)}
            className="!bg-blue-600 hover:!bg-blue-700 !text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-6 py-3 rounded-xl border-0"
          >
            <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Create New Program
          </Button>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs.map((program) => (
          <Card key={program.id} className="hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{program.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{program.description}</p>
              </div>
              <Badge variant={program.isActive ? 'success' : 'gray'} dot>
                {program.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Frequency:</span>
                <Badge variant="info" size="sm">{program.sessionFrequency}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Session Types:</span>
                <div className="flex gap-1">
                  {program.sessionTypes?.map((type, idx) => (
                    <Badge key={idx} variant="primary" size="sm">{type.replace('_', ' ')}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Sessions:</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{program.sessionCount || 0}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={() => handleAddSession(program.id)}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Manage Sessions
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Program Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Program"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header Info */}
          <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white text-xl flex-shrink-0">
                ⚕️
              </div>
              <div>
                <p className="text-sm font-semibold text-red-900 dark:text-red-300">Program Information</p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  Fill in the details below to create a new health program. You can add sessions after creation.
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            <Input
              label="Program Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Mental Health Support Program"
            />
            
            <TextArea
              label="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a detailed description of what this program offers, its goals, and target participants..."
              rows={4}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Session Types (Select at least one) *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {Object.values(SessionType).map((type) => {
                  const isSelected = formData.sessionTypes.includes(type);
                  return (
                    <label
                      key={type}
                      className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, sessionTypes: [...formData.sessionTypes, type] });
                          } else {
                            setFormData({ ...formData, sessionTypes: formData.sessionTypes.filter(t => t !== type) });
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
              {formData.sessionTypes.length === 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Please select at least one session type
                </p>
              )}
            </div>

            <Select
              label="Session Frequency *"
              value={formData.sessionFrequency}
              onChange={(e) => setFormData({ ...formData, sessionFrequency: e.target.value as Frequency })}
              options={Object.values(Frequency).map(freq => ({
                value: freq,
                label: freq.charAt(0).toUpperCase() + freq.slice(1) + ' sessions'
              }))}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setFormData({
                  name: '',
                  description: '',
                  sessionTypes: [],
                  sessionFrequency: Frequency.DAILY,
                  sessionCount: 0,
                });
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProgram}
              className="flex-1 !bg-red-600 hover:!bg-red-700 !text-white font-semibold shadow-lg hover:shadow-xl transition-all border-0"
              disabled={!formData.name || !formData.description || formData.sessionTypes.length === 0}
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Program
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

