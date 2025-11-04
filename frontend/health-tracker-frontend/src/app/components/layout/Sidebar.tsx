'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.GUEST, UserRole.PATIENT] },
  { name: 'Programs', href: '/programs', icon: '🏥', roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.GUEST, UserRole.PATIENT] },
  { name: 'Enrolled Programs', href: '/patient/enrolled-programs', icon: '📋', roles: [UserRole.PATIENT] },
  { name: 'My Medications', href: '/patient/my-medications', icon: '💊', roles: [UserRole.PATIENT] },
  { name: 'Program Management', href: '/admin/program-management', icon: '⚙️', roles: [UserRole.ADMIN] },
  { name: 'Patients', href: '/patients', icon: '👤', roles: [UserRole.ADMIN, UserRole.STAFF] },
  { name: 'Enrollments', href: '/enrollments', icon: '📋', roles: [UserRole.ADMIN, UserRole.STAFF] },
  { name: 'Medications', href: '/medications', icon: '💊', roles: [UserRole.ADMIN, UserRole.STAFF] },
  { name: 'Users', href: '/users', icon: '👥', roles: [UserRole.ADMIN] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role as UserRole)
  );

  return (
    <aside className="w-64 bg-gradient-to-b from-blue-600 to-blue-800 dark:from-gray-900 dark:to-gray-800 border-r border-blue-700 dark:border-gray-700 min-h-screen shadow-xl">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold shadow-lg">
            ⚕️
          </div>
          <div>
            <h1 className="text-lg font-bold text-white dark:text-gray-100">Health Tracker</h1>
            <p className="text-xs text-blue-100 dark:text-gray-400">Management System</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all',
                  isActive
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-lg'
                    : 'text-blue-50 dark:text-gray-300 hover:bg-blue-500 dark:hover:bg-gray-700/50 hover:shadow-md'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}