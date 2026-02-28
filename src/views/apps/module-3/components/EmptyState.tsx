/**
 * Empty State - Beautiful empty state component with illustrations
 */

import { LucideIcon, Search, Users, Link, Database, FileText } from 'lucide-react';
import { Button } from 'src/components/ui/button';
import { cn } from 'src/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'link' | 'database' | 'document';
  className?: string;
}

const variantIcons: Record<string, LucideIcon> = {
  default: Users,
  search: Search,
  link: Link,
  database: Database,
  document: FileText,
};

const variantColors: Record<string, string> = {
  default: 'from-primary/20 to-primary/5',
  search: 'from-blue-500/20 to-blue-500/5',
  link: 'from-amber-500/20 to-amber-500/5',
  database: 'from-emerald-500/20 to-emerald-500/5',
  document: 'from-purple-500/20 to-purple-500/5',
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const Icon = icon || variantIcons[variant];
  const gradientColor = variantColors[variant];

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      'border-2 border-dashed rounded-2xl bg-muted/20',
      className
    )}>
      {/* Animated icon container */}
      <div className="relative mb-6">
        {/* Glow effect */}
        <div className={cn(
          'absolute inset-0 rounded-full blur-2xl opacity-60',
          `bg-gradient-to-br ${gradientColor}`
        )} />
        
        {/* Main icon container */}
        <div className={cn(
          'relative p-6 rounded-full',
          `bg-gradient-to-br ${gradientColor}`,
          'border border-primary/10'
        )}>
          <Icon className="h-12 w-12 text-primary/80" />
        </div>
        
        {/* Decorative ring */}
        <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/20 animate-spin-slow" 
          style={{ animationDuration: '20s' }} 
        />
      </div>
      
      {/* Text content */}
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-md leading-relaxed mb-6">
        {description}
      </p>
      
      {/* Action button */}
      {action && (
        <Button onClick={action.onClick} className="gap-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
