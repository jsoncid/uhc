/**
 * QuickActions - Action buttons that appear on hover for patient rows
 */
import { Button } from 'src/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'src/components/ui/tooltip';
import { Eye, Tag, FileText } from 'lucide-react';

interface QuickActionsProps {
  onView: () => void;
  onTag: () => void;
  onViewRecords: () => void;
  isLinked: boolean;
}

export const QuickActions = ({ 
  onView, 
  onTag,
  onViewRecords,
  isLinked
}: QuickActionsProps) => (
  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
          onClick={(e) => { e.stopPropagation(); onView(); }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>View Details</TooltipContent>
    </Tooltip>
    
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-amber-500/10 hover:text-amber-600"
          onClick={(e) => { e.stopPropagation(); onTag(); }}
        >
          <Tag className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isLinked ? 'Manage Links' : 'Link to Hospital'}</TooltipContent>
    </Tooltip>
    
    {isLinked && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-600"
            onClick={(e) => { e.stopPropagation(); onViewRecords(); }}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Records</TooltipContent>
      </Tooltip>
    )}
  </div>
);

export default QuickActions;
