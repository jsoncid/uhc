/**
 * LinkStatusIndicator - Shows whether a patient is linked to hospital records
 */
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'src/components/ui/tooltip';

interface LinkStatusIndicatorProps {
  isLinked: boolean;
  linkCount: number;
}

export const LinkStatusIndicator = ({ isLinked, linkCount }: LinkStatusIndicatorProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className={`flex items-center gap-1 ${isLinked ? 'text-green-600' : 'text-amber-500'}`}>
        {isLinked ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {linkCount > 1 && (
              <span className="text-xs font-medium">{linkCount}</span>
            )}
          </>
        ) : (
          <div className="w-2 h-2 rounded-full bg-amber-400" />
        )}
      </div>
    </TooltipTrigger>
    <TooltipContent>
      {isLinked 
        ? linkCount > 1 
          ? `Linked to ${linkCount} hospital records` 
          : 'Linked to hospital record'
        : 'Not linked - Click to tag'}
    </TooltipContent>
  </Tooltip>
);

export default LinkStatusIndicator;
