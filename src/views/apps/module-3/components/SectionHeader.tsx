import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';

interface SectionHeaderProps {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: {
    label: string;
    variant: 'lightPrimary' | 'lightSuccess' | 'lightWarning' | 'lightInfo';
  };
}

const SectionHeader = ({ icon: Icon, title, description, badge }: SectionHeaderProps) => {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {badge && (
            <Badge variant={badge.variant} className="text-[10px] px-2 py-0.5 font-medium">
              {badge.label}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
};

export default SectionHeader;
