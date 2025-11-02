'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Loading } from '../../components/ui/Loading';
import { formatDate } from '../../lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  if (loading) return <Loading />;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Overview of your healthcare management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Alerts Section */}
      {(alerts?.overdueSessions?.length > 0 || alerts?.inactiveEnrollments?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {alerts.overdueSessions?.length > 0 && (
            <Card title="⚠️ Overdue Sessions" className="border-l-4 border-l-red-500">
              <div className="space-y-3">
                {alerts.overdueSessions.slice(0, 5).map((session: any) => (
                  <div key={session.id} className="p-4 bg-red-50 rounded-xl border border-red-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{session.patient}</h4>
                      <Badge variant="danger" dot>Missed</Badge>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <Badge variant={session.status === 'attended' ? 'success' : 'danger'} size="sm">
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
