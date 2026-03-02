/**
 * SectionNavItem - Navigation button for form sections
 */
import { CheckCircle2 } from 'lucide-react';
import type { NavSection } from './types';

interface SectionNavItemProps {
  section: NavSection;
  onClick: () => void;
}

export const SectionNavItem = ({ section, onClick }: SectionNavItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200
        ${section.isActive 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
        }
      `}
    >
      <section.icon className={`h-4 w-4 ${section.isActive ? '' : section.isComplete ? 'text-green-600' : ''}`} />
      <span className="text-sm font-medium flex-1">{section.label}</span>
      {section.isComplete && !section.isActive && (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      )}
    </button>
  );
};

export default SectionNavItem;
