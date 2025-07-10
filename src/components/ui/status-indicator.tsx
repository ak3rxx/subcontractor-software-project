import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatusIndicatorProps {
  status: 'pending' | 'success' | 'error' | 'idle' | 'warning';
  message?: string;
  size?: 'sm' | 'lg' | 'md';
  showIcon?: boolean;
  variant?: 'inline' | 'badge' | 'full';
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  size = 'md',
  showIcon = true,
  variant = 'inline',
  className
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Loader2,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          spin: true,
          badgeVariant: 'secondary' as const
        };
      case 'success':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          spin: false,
          badgeVariant: 'default' as const
        };
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          spin: false,
          badgeVariant: 'destructive' as const
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          spin: false,
          badgeVariant: 'secondary' as const
        };
      default:
        return {
          icon: Clock,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          spin: false,
          badgeVariant: 'outline' as const
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (variant === 'badge') {
    return (
      <Badge variant={config.badgeVariant} className={cn('flex items-center gap-1', className)}>
        {showIcon && (
          <Icon 
            className={cn(
              sizeClasses[size],
              config.spin && 'animate-spin'
            )}
          />
        )}
        {message}
      </Badge>
    );
  }

  if (variant === 'full') {
    return (
      <div 
        className={cn(
          'flex items-center gap-2 p-2 rounded-md border',
          config.bgColor,
          config.borderColor,
          textSizeClasses[size],
          className
        )}
      >
        {showIcon && (
          <Icon 
            className={cn(
              sizeClasses[size],
              config.color,
              config.spin && 'animate-spin'
            )}
          />
        )}
        {message && (
          <span className={config.color}>
            {message}
          </span>
        )}
      </div>
    );
  }

  // inline variant (default)
  return (
    <div className={cn('flex items-center gap-1', textSizeClasses[size], className)}>
      {showIcon && (
        <Icon 
          className={cn(
            sizeClasses[size],
            config.color,
            config.spin && 'animate-spin'
          )}
        />
      )}
      {message && (
        <span className={config.color}>
          {message}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;