/**
 * Search Input - Enhanced search input with loading state
 */

import { forwardRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { cn } from 'src/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear?: () => void;
  placeholder?: string;
  isLoading?: boolean;
  showClearButton?: boolean;
  buttonLabel?: string;
  className?: string;
  inputClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({
    value,
    onChange,
    onSearch,
    onClear,
    placeholder = 'Search...',
    isLoading = false,
    showClearButton = true,
    buttonLabel = 'Search',
    className,
    inputClassName,
  }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !isLoading) {
        onSearch();
      }
    };

    const handleClear = () => {
      onChange('');
      onClear?.();
    };

    return (
      <div className={cn('flex gap-2', className)}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'pl-10 pr-10 h-11',
              'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0',
              'transition-shadow duration-200',
              inputClassName
            )}
            disabled={isLoading}
          />
          {showClearButton && value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              disabled={isLoading}
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        
        <Button
          onClick={onSearch}
          disabled={isLoading || !value.trim()}
          size="lg"
          className="gap-2 min-w-[100px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Searching...</span>
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{buttonLabel}</span>
            </>
          )}
        </Button>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
