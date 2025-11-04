import { cn } from '../../lib/utils';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <table className={cn('min-w-full divide-y divide-gray-200 dark:divide-gray-700', className)}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">{children}</tbody>;
}

export function TableRow({ children, className, onClick }: TableProps & { onClick?: () => void }) {
  return (
    <tr 
      className={cn(
        'transition-colors group',
        onClick && 'cursor-pointer hover:bg-primary-50 dark:hover:bg-gray-700',
        !onClick && 'hover:bg-gray-50 dark:hover:bg-gray-700',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: TableProps) {
  return (
    <th
      className={cn(
        'px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className }: TableProps) {
  return (
    <td className={cn('px-6 py-4 text-sm text-gray-900 dark:text-white group-hover:text-white dark:group-hover:text-white transition-colors', className)}>
      {children}
    </td>
  );
}