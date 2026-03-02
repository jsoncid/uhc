/**
 * FilterChip - A badge component for active filters with remove button
 */
import { Badge } from 'src/components/ui/badge';
import { X } from 'lucide-react';
import { ActiveFilter } from './types';

interface FilterChipProps {
  filter: ActiveFilter;
  onRemove: (id: string) => void;
}

export const FilterChip = ({ filter, onRemove }: FilterChipProps) => (
  <Badge 
    variant="secondary" 
    className="px-3 py-1.5 gap-1.5 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-default"
  >
    {filter.label}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemove(filter.id);
      }}
      className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
      title={`Remove ${filter.label} filter`}
      aria-label={`Remove ${filter.label} filter`}
    >
      <X className="h-3 w-3" />
    </button>
  </Badge>
);

export default FilterChip;
