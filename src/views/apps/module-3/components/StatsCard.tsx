/**
 * Stats Card - Animated metric display card
 * 
 * Features:
 * - Gradient backgrounds
 * - Animated count-up numbers
 * - Icon with colored container
 * - Trend indicators
 */

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from 'src/components/ui/card';
import { cn } from 'src/lib/utils';
import { useEffect, useState } from 'react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colorScheme?: 'blue' | 'green' | 'amber' | 'purple' | 'rose' | 'emerald';
  animate?: boolean;
  className?: string;
}

const colorSchemes = {
  blue: {
    container: 'bg-gradient-to-br from-blue-500/15 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50',
    icon: 'bg-blue-500 shadow-blue-500/25',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    container: 'bg-gradient-to-br from-green-500/15 to-green-600/5 border-green-200/50 dark:border-green-800/50',
    icon: 'bg-green-500 shadow-green-500/25',
    text: 'text-green-600 dark:text-green-400',
  },
  amber: {
    container: 'bg-gradient-to-br from-amber-500/15 to-amber-600/5 border-amber-200/50 dark:border-amber-800/50',
    icon: 'bg-amber-500 shadow-amber-500/25',
    text: 'text-amber-600 dark:text-amber-400',
  },
  purple: {
    container: 'bg-gradient-to-br from-purple-500/15 to-purple-600/5 border-purple-200/50 dark:border-purple-800/50',
    icon: 'bg-purple-500 shadow-purple-500/25',
    text: 'text-purple-600 dark:text-purple-400',
  },
  rose: {
    container: 'bg-gradient-to-br from-rose-500/15 to-rose-600/5 border-rose-200/50 dark:border-rose-800/50',
    icon: 'bg-rose-500 shadow-rose-500/25',
    text: 'text-rose-600 dark:text-rose-400',
  },
  emerald: {
    container: 'bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50',
    icon: 'bg-emerald-500 shadow-emerald-500/25',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  colorScheme = 'blue',
  animate = true,
  className,
}: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  const colors = colorSchemes[colorScheme];

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    const stepDuration = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, animate]);

  return (
    <Card className={cn('border', colors.container, className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className={cn('p-2.5 rounded-xl shadow-lg', colors.icon)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">
              {displayValue.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">
              {title}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground/80 mt-1">
                {description}
              </p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-xs font-medium',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}% from last month</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatsCard;
