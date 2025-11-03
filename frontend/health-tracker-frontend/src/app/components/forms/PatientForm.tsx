'use client';

import { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { TextArea } from '../ui/TextArea';
import { Button } from '../ui/Buttons';

interface PatientFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel?: () => void;
  initialData?: any;
  isLoading?: boolean;
}

export function PatientForm({ onSubmit, onCancel, initialData, isLoading = false }: PatientFormProps) {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    patientNumber: initialData?.patientNumber || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    gender: initialData?.gender || '',
    phoneNumber: initialData?.phoneNumber || '',
    email: initialData?.email || '',
    address: initialData?.address || '',
    medicalHistory: initialData?.medicalHistory || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.patientNumber.trim()) {
      newErrors.patientNumber = 'Patient number is required';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="First Name *"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          error={errors.firstName}
          placeholder="Enter first name"
        />
        <Input
          label="Last Name *"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          error={errors.lastName}
          placeholder="Enter last name"
        />
        <Input
          label="Patient Number *"
          value={formData.patientNumber}
          onChange={(e) => setFormData({ ...formData, patientNumber: e.target.value })}
          error={errors.patientNumber}
          placeholder="Enter patient number"
        />
        <Input
          label="Date of Birth *"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          error={errors.dateOfBirth}
        />
        <Select
          label="Gender *"
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          error={errors.gender}
          options={[
            { value: '', label: 'Select gender' },
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
            { value: 'Other', label: 'Other' },
          ]}
        />
        <Input
          label="Phone Number"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          placeholder="Enter phone number"
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter email address"
        />
        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter address"
        />
      </div>
      <TextArea
        label="Medical History"
        value={formData.medicalHistory}
        onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
        placeholder="Enter medical history (if any)"
        rows={4}
      />
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1 !bg-blue-600 hover:!bg-blue-700 !text-white border-0" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Patient' : 'Create Patient'}
        </Button>
      </div>
    </form>
  );
}

