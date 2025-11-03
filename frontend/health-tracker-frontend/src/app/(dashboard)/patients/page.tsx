'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { Patient, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Buttons';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { formatDate } from '../../lib/utils';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      // If admin, don't pass search - backend will return all patients
      const data = await api.patients.getAll(user?.role === UserRole.ADMIN ? undefined : search);
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.role, search]);


  // For admins: fetch immediately when component mounts or role changes
  // For non-admins: debounce search
  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      // Admin: fetch all immediately
      fetchPatients();
      return;
    }

    // Non-admin: debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchPatients();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [user?.role, search, fetchPatients]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in bg-gray-50 dark:bg-gray-900 min-h-screen pb-8">
      {/* Patients Header */}
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Patient Management</h1>
            <p className="text-blue-100 dark:text-gray-300">Manage patient records and information</p>
          </div>
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.STAFF) && (
            <Link href="/patients/new">
              <Button size="lg" className="!bg-blue-600 hover:!bg-blue-700 !text-white border-0">
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Patient
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Patients Table */}
      <div className="px-6">
        <Card>
          {/* Only show search box for non-admin users */}
          {user?.role !== UserRole.ADMIN && (
            <div className="mb-6">
              <Input
                placeholder="Search patients by name or patient number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>
          )}

          {patients.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-black dark:text-white text-lg font-medium">No patients found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black font-semibold">Patient Number</TableHead>
                    <TableHead className="text-black font-semibold">Name</TableHead>
                    <TableHead className="text-black font-semibold">Gender</TableHead>
                    <TableHead className="text-black font-semibold">Contact</TableHead>
                    <TableHead className="text-black font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <TableCell>
                        <span className="font-mono text-black font-semibold">
                          {patient.patientNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-black text-base">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-xs text-black mt-0.5">
                            {formatDate(patient.dateOfBirth)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="gray" size="sm">{patient.gender}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {patient.phoneNumber && <div className="text-black font-medium">{patient.phoneNumber}</div>}
                          {patient.email && (
                            <div className="flex items-center gap-2 mt-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="text-black text-sm font-medium">{patient.email}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={patient.isActive ? 'success' : 'gray'} dot>
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}