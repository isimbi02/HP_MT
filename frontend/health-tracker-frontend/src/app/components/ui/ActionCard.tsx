'use client';

import Link from 'next/link';
import { cn } from '../../lib/utils';

interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  color?: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'indigo';
  badge?: string;
  onClick?: () => void;
}

const colorClasses = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    hover: 'hover:from-blue-600 hover:to-blue-700',
    light: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  green: {
    bg: 'from-green-500 to-green-600',
    hover: 'hover:from-green-600 hover:to-green-700',
    light: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    hover: 'hover:from-purple-600 hover:to-purple-700',
    light: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  red: {
    bg: 'from-red-500 to-red-600',
    hover: 'hover:from-red-600 hover:to-red-700',
    light: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
  orange: {
    bg: 'from-orange-500 to-orange-600',
    hover: 'hover:from-orange-600 hover:to-orange-700',
    light: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
  },
  indigo: {
    bg: 'from-indigo-500 to-indigo-600',
    hover: 'hover:from-indigo-600 hover:to-indigo-700',
    light: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
};

export function ActionCard({ title, description, href, icon, color = 'blue', badge, onClick }: ActionCardProps) {
  const colors = colorClasses[color];

  const content = (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border-2 transition-all duration-300',
        'bg-white dark:bg-gray-800',
        colors.border,
        'hover:shadow-xl hover:scale-[1.02]',
        'cursor-pointer'
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            'w-14 h-14 rounded-xl flex items-center justify-center text-2xl',
            `bg-gradient-to-br ${colors.bg} ${colors.hover} shadow-lg transition-all`,
            'group-hover:scale-110'
          )}>
            {icon}
          </div>
          {badge && (
            <span className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-semibold',
              colors.light,
              colors.text
            )}>
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {description}
        </p>
        <div className="mt-4 flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:translate-x-2 transition-transform">
          Get started
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <div className={cn(
        'absolute bottom-0 left-0 right-0 h-1',
        `bg-gradient-to-r ${colors.bg}`,
        'transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300'
      )} />
    </div>
  );

  if (onClick) {
    return (
      <div onClick={onClick}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  );
}

