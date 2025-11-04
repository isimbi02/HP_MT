'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { formatDate } from '../../lib/utils';
import { PatientDashboard } from '../../components/dashboard/PatientDashboard';
import { UserRole } from '../../types';
import { ActionCard } from '../../components/ui/ActionCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === UserRole.PATIENT || user?.role === UserRole.GUEST) {
      setLoading(false);
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [statsData, alertsData, activityData] = await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getAlerts(),
        api.dashboard.getRecentActivity(),
      ]);
      setStats(statsData);
      setAlerts(alertsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show patient/guest dashboard
  if (user?.role === UserRole.PATIENT || user?.role === UserRole.GUEST) {
    return <PatientDashboard />;
  }

  if (loading) return <Loading />;

  const getRoleInfo = () => {
    switch (user?.role) {
      case 'admin':
        return {
          title: 'Administrator',
          icon: '👨‍💼',
          color: 'from-red-500 to-red-600',
          bgColor: 'from-red-50 to-red-100',
          textColor: 'text-red-700',
          description: 'Full system access and management'
        };
      case 'staff':
        return {
          title: 'Healthcare Staff',
          icon: '👨‍⚕️',
          color: 'from-blue-500 to-blue-600',
          bgColor: 'from-blue-50 to-blue-100',
          textColor: 'text-blue-700',
          description: 'Manage patients and sessions'
        };
      case 'patient':
        return {
          title: 'Patient',
          icon: '👤',
          color: 'from-green-500 to-green-600',
          bgColor: 'from-green-50 to-green-100',
          textColor: 'text-green-700',
          description: 'View your programs and medications'
        };
      case 'guest':
        return {
          title: 'Guest',
          icon: '👋',
          color: 'from-gray-500 to-gray-600',
          bgColor: 'from-gray-50 to-gray-100',
          textColor: 'text-gray-700',
          description: 'Limited access to public programs'
        };
      default:
        return {
          title: 'User',
          icon: '👤',
          color: 'from-primary-500 to-primary-600',
          bgColor: 'from-primary-50 to-primary-100',
          textColor: 'text-primary-700',
          description: 'System user'
        };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <div className="space-y-6 animate-fade-in bg-gray-50 dark:bg-gray-900 min-h-screen pb-8">
      {/* Dashboard Header with Role Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-blue-100 dark:text-gray-300">Overview of your healthcare management system</p>
          </div>
          
          {/* Role Display Card */}
          <div className={`bg-gradient-to-br ${roleInfo.bgColor} dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 shadow-lg border-2 border-white dark:border-gray-500 min-w-[200px]`}>
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${roleInfo.color} flex items-center justify-center text-2xl shadow-md`}>
                {roleInfo.icon}
              </div>
              <div>
                <p className={`text-lg font-bold ${roleInfo.textColor} dark:text-gray-100 capitalize`}>{roleInfo.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{roleInfo.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6">
        <StatCard
          title="Total Patients"
          value={stats?.patients.total || 0}
          subtitle={`${stats?.patients.active || 0} active`}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Programs"
          value={stats?.programs.total || 0}
          subtitle={`${stats?.programs.active || 0} active`}
          icon="🏥"
          color="green"
        />
        <StatCard
          title="Enrollments"
          value={stats?.enrollments.total || 0}
          subtitle={`${stats?.enrollments.ongoing || 0} ongoing`}
          icon="📋"
          color="purple"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats?.sessions.attendanceRate || 0}%`}
          subtitle={`${stats?.sessions.attended || 0}/${stats?.sessions.total || 0} attended`}
          icon="📊"
          color="orange"
        />
      </div>

      {/* Quick Actions Section */}
      <div className="px-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quick Actions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Access key features and management tools</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {user?.role === UserRole.ADMIN && (
            <>
              <ActionCard
                title="Program Management"
                description="Create and manage health programs"
                href="/admin/program-management"
                icon="⚙️"
                color="red"
                badge="Admin Only"
              />
              <ActionCard
                title="Manage Users"
                description="View users and control access to the system"
                href="/users"
                icon="👥"
                color="blue"
              />
              <ActionCard
                title="Patient Management"
                description="View and manage patient records and information"
                href="/patients"
                icon="👤"
                color="indigo"
              />
              <ActionCard
                title="Manage Enrollments"
                description="View and manage patients enrollments"
                href="/enrollments"
                icon="📋"
                color="orange"
              />
            </>
          )}
          {(user?.role === UserRole.STAFF || user?.role === UserRole.ADMIN) && (
            <>
              <ActionCard
                title="Manage Medications"
                description="View all medications and assign medication to patients"
                href="/medications"
                icon="💊"
                color="purple"
                badge={user?.role === UserRole.ADMIN ? "Admin & Staff" : "Staff"}
              />
              <ActionCard
                title="Medication Dispensation"
                description="Dispense medication to patients and view dispensations"
                href="/staff/medication-dispensation"
                icon="💉"
                color="green"
                badge={user?.role === UserRole.ADMIN ? "Admin & Staff" : "Staff"}
              />
            </>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      {(alerts?.overdueSessions?.length > 0 || alerts?.inactiveEnrollments?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6">
          {alerts.overdueSessions?.length > 0 && (
            <Card title="⚠️ Overdue Sessions" className="border-l-4 border-l-red-500">
              <div className="space-y-3">
                {alerts.overdueSessions.slice(0, 5).map((session: any) => (
                  <div key={session.id} className="p-4 bg-red-50 rounded-xl border border-red-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{session.patient}</h4>
                      <Badge variant="missed" dot>Missed</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{session.program}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      📅 Scheduled: {formatDate(session.scheduledDate)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {alerts.inactiveEnrollments?.length > 0 && (
            <Card title="ℹ️ Inactive Enrollments" className="border-l-4 border-l-yellow-500">
              <div className="space-y-3">
                {alerts.inactiveEnrollments.slice(0, 5).map((enrollment: any) => (
                  <div key={enrollment.id} className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{enrollment.patient}</h4>
                      <Badge variant="warning" dot>No Activity</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{enrollment.program}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      📅 Enrolled: {formatDate(enrollment.enrollmentDate)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6">
        <Card title="📝 Recent Sessions" subtitle="Latest session records">
          <div className="space-y-3">
            {recentActivity?.recentSessions?.slice(0, 5).map((session: any) => (
              <div key={session.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 text-lg">📅</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">{session.patient}</p>
                    <Badge variant={session.status} size="sm">
                      {session.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{session.program}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    By {session.recordedBy} • {formatDate(session.scheduledDate)}
                  </p>
                </div>
              </div>
            ))}
            {!recentActivity?.recentSessions?.length && (
              <p className="text-center text-gray-500 py-8">No recent sessions</p>
            )}
          </div>
        </Card>

        <Card title="💊 Recent Medications" subtitle="Latest medication distributions">
          <div className="space-y-3">
            {recentActivity?.recentDispensations?.slice(0, 5).map((dispensation: any) => (
              <div key={dispensation.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-600 text-lg">💊</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">{dispensation.patient}</p>
                    <Badge variant="success" size="sm" dot>Dispensed</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {dispensation.medication} - {dispensation.dose}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Qty: {dispensation.quantity} • {formatDate(dispensation.dispensedDate)}
                  </p>
                </div>
              </div>
            ))}
            {!recentActivity?.recentDispensations?.length && (
              <p className="text-center text-gray-500 py-8">No recent dispensations</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
