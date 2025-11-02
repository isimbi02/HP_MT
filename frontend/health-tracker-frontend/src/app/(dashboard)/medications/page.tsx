'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { Medication, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Buttons';
import { Card } from '../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { formatEnumValue } from '../../lib/utils';

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const data = await api.medications.getAll();
      setMedications(data);
    } catch (error) {
      console.error('Error fetching medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this medication?')) {
      try {
        await api.medications.delete(id);
        fetchMedications();
      } catch (error) {
        alert('Error deleting medication');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medications</h1>
          <p className="text-gray-600 mt-2">Manage medications and dispensation</p>
        </div>
        <div className="flex gap-2">
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.STAFF) && (
            <Link href="/medications/dispense">
              <Button variant="secondary">Dispense Medication</Button>
            </Link>
          )}
          {user?.role === UserRole.ADMIN && (
            <Link href="/medications/new">
              <Button>+ New Medication</Button>
            </Link>
          )}
        </div>
      </div>

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Dose</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medications.map((medication) => (
                <TableRow key={medication.id}>
                  <TableCell className="font-medium">{medication.name}</TableCell>
                  <TableCell>{medication.dose}</TableCell>
                  <TableCell>{formatEnumValue(medication.frequency)}</TableCell>
                  {/* <TableCell>{medication.program.name}</TableCell> */}
                  <TableCell>
                    <Badge variant={medication.isActive ? 'active' : 'inactive'}>
                      {medication.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user?.role === UserRole.ADMIN && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(medication.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}