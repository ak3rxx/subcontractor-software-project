import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Mail, Eye, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import StatusIndicator from './status-indicator';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  disabled?: boolean;
  keyboard?: string;
  external?: boolean;
}

interface QuickActionsProps {
  actions: QuickAction[];
  item?: any;
  statusInfo?: {
    isUpdating: boolean;
    statusMessage?: string;
    pendingAction?: any;
  };
  size?: 'sm' | 'lg' | 'md';
  variant?: 'dropdown' | 'buttons' | 'mixed';
  className?: string;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  item,
  statusInfo,
  size = 'sm',
  variant = 'dropdown',
  className
}) => {
  const getVariantIcon = (actionVariant?: string) => {
    switch (actionVariant) {
      case 'destructive':
        return XCircle;
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      default:
        return null;
    }
  };

  const primaryActions = actions.filter(a => ['view', 'edit'].includes(a.id));
  const secondaryActions = actions.filter(a => !['view', 'edit'].includes(a.id));

  if (variant === 'buttons') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {statusInfo?.isUpdating && (
          <StatusIndicator
            status="pending"
            message={statusInfo.statusMessage}
            size={size}
            variant="badge"
          />
        )}
        {actions.map((action) => {
          const VariantIcon = getVariantIcon(action.variant);
          const ActionIcon = action.icon || VariantIcon;
          
          return (
            <Button
              key={action.id}
              size={size === 'md' ? 'sm' : size as any}
              variant={action.variant === 'destructive' ? 'destructive' : 'ghost'}
              onClick={action.onClick}
              disabled={action.disabled || statusInfo?.isUpdating}
              title={action.keyboard ? `${action.label} (${action.keyboard})` : action.label}
              className={cn(
                action.variant === 'success' && 'text-green-600 hover:text-green-700 hover:bg-green-50',
                action.variant === 'warning' && 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
              )}
            >
              {ActionIcon && <ActionIcon className="h-4 w-4" />}
              {action.external && <ExternalLink className="h-3 w-3 ml-1" />}
            </Button>
          );
        })}
      </div>
    );
  }

  if (variant === 'mixed') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {statusInfo?.isUpdating && (
          <StatusIndicator
            status="pending"
            message={statusInfo.statusMessage}
            size={size}
            variant="badge"
          />
        )}
        
        {/* Primary actions as buttons */}
        {primaryActions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <Button
              key={action.id}
              size={size === 'md' ? 'sm' : size as any}
              variant="ghost"
              onClick={action.onClick}
              disabled={action.disabled || statusInfo?.isUpdating}
              title={action.keyboard ? `${action.label} (${action.keyboard})` : action.label}
            >
              {ActionIcon && <ActionIcon className="h-4 w-4" />}
            </Button>
          );
        })}

        {/* Secondary actions in dropdown */}
        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size={size === 'md' ? 'sm' : size as any} variant="ghost" disabled={statusInfo?.isUpdating}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {secondaryActions.map((action, index) => {
                const VariantIcon = getVariantIcon(action.variant);
                const ActionIcon = action.icon || VariantIcon;
                
                return (
                  <React.Fragment key={action.id}>
                    <DropdownMenuItem
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={cn(
                        action.variant === 'destructive' && 'text-red-600 focus:text-red-600',
                        action.variant === 'success' && 'text-green-600 focus:text-green-600',
                        action.variant === 'warning' && 'text-orange-600 focus:text-orange-600'
                      )}
                    >
                      {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                      {action.label}
                      {action.keyboard && (
                        <kbd className="ml-auto text-xs bg-muted px-1 py-0.5 rounded">
                          {action.keyboard}
                        </kbd>
                      )}
                      {action.external && <ExternalLink className="h-3 w-3 ml-1" />}
                    </DropdownMenuItem>
                    {index < secondaryActions.length - 1 && action.variant === 'destructive' && (
                      <DropdownMenuSeparator />
                    )}
                  </React.Fragment>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {statusInfo?.isUpdating && (
        <StatusIndicator
          status="pending"
          message={statusInfo.statusMessage}
          size={size}
          variant="badge"
        />
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={size === 'md' ? 'sm' : size as any} variant="ghost" disabled={statusInfo?.isUpdating}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {actions.map((action, index) => {
            const VariantIcon = getVariantIcon(action.variant);
            const ActionIcon = action.icon || VariantIcon;
            
            return (
              <React.Fragment key={action.id}>
                <DropdownMenuItem
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    action.variant === 'destructive' && 'text-red-600 focus:text-red-600',
                    action.variant === 'success' && 'text-green-600 focus:text-green-600',
                    action.variant === 'warning' && 'text-orange-600 focus:text-orange-600'
                  )}
                >
                  {ActionIcon && <ActionIcon className="h-4 w-4 mr-2" />}
                  {action.label}
                  {action.keyboard && (
                    <kbd className="ml-auto text-xs bg-muted px-1 py-0.5 rounded">
                      {action.keyboard}
                    </kbd>
                  )}
                  {action.external && <ExternalLink className="h-3 w-3 ml-1" />}
                </DropdownMenuItem>
                {index < actions.length - 1 && action.variant === 'destructive' && (
                  <DropdownMenuSeparator />
                )}
              </React.Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default QuickActions;