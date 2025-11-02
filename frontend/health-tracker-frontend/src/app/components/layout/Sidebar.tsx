'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.GUEST] },
  { name: 'Programs', href: '/programs', icon: '🏥', roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.GUEST] },
  { name: 'Patients', href: '/patients', icon: '👥', roles: [UserRole.ADMIN, UserRole.STAFF] },
  { name: 'Enrollments', href: '/enrollments', icon: '📋', roles: [UserRole.ADMIN, UserRole.STAFF] },
  { name: 'Medications', href: '/medications', icon: '💊', roles: [UserRole.ADMIN, UserRole.STAFF] },
  { name: 'Users', href: '/users', icon: '👤', roles: [UserRole.ADMIN] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(user?.role as UserRole)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white text-xl">
            ⚕️
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Health</h1>
            <p className="text-xs text-gray-600">Tracker System</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
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