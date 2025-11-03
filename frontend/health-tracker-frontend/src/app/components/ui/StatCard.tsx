import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export function StatCard({ title, value, subtitle, icon, trend, color = 'blue' }: StatCardProps) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl shadow-lg border border-blue-200 dark:border-gray-600 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">{title}</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-gray-100 mt-3">{value}</p>
          {subtitle && <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">{subtitle}</p>}
          {trend && (
            <div className="mt-4 flex items-center gap-1">
              <span className={cn(
                'text-xs font-semibold px-2 py-1 rounded',
                trend.isPositive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
              )}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
            </div>
          )}
        </div>
        <div className={cn(
          'w-16 h-16 rounded-xl flex items-center justify-center text-3xl bg-white dark:bg-gray-800 shadow-md',
          colors[color]
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}