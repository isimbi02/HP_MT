import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'; // Added 'outline'
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: '!bg-blue-600 !text-white hover:!bg-blue-700 focus:ring-blue-500',
    secondary: '!bg-gray-600 !text-white hover:!bg-gray-700 focus:ring-gray-500 border-0',
    danger: '!bg-red-600 !text-white hover:!bg-red-700 focus:ring-red-500',
    ghost: '!bg-gray-200 !text-gray-700 hover:!bg-gray-300',
    outline: '!border-2 !border-blue-600 !text-blue-600 !bg-transparent hover:!bg-blue-50 focus:ring-blue-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}