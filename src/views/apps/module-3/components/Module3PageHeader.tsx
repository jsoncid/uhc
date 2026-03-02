/**
 * Module 3 Page Header - Shared component for consistent page headers
 * 
 * Features:
 * - Gradient icon container
 * - Title with description
 * - Optional action buttons
 * - Optional breadcrumb
 */

import { LucideIcon } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { cn } from 'src/lib/utils';

interface PageHeaderAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  disabled?: boolean;
}

interface Module3PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: PageHeaderAction[];
  iconClassName?: string;
  iconContainerClassName?: string;
}

export function Module3PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  iconClassName,
  iconContainerClassName,
}: Module3PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'p-3 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 shadow-sm',
            'dark:from-primary/20 dark:to-primary/5 dark:border-primary/30',
            iconContainerClassName
          )}
        >
          <Icon className={cn('h-8 w-8 text-primary', iconClassName)} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1 max-w-2xl">
            {description}
          </p>
        </div>
      </div>
      
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              onClick={action.onClick}
              disabled={action.disabled}
              className="gap-2"
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Module3PageHeader;
