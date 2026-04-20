/**
 * Modern Tabs - Pill-style tabs with smooth animations
 */

import { LucideIcon } from 'lucide-react';
import { cn } from 'src/lib/utils';

interface Tab {
  value: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

interface ModernTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ModernTabs({ tabs, activeTab, onChange, className }: ModernTabsProps) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1 p-1.5 rounded-2xl',
      'bg-muted/60 backdrop-blur-sm border shadow-inner',
      className
    )}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-xl',
              'text-sm font-medium transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
              isActive
                ? 'bg-background text-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={cn(
                'ml-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted-foreground/20 text-muted-foreground'
              )}>
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ModernTabs;
