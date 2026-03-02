/**
 * SidebarNavigation - Sticky sidebar with completion, navigation, and actions
 */
import { Card, CardContent } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Separator } from 'src/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip';
import { Database, RotateCcw, Save, AlertCircle, Loader2 } from 'lucide-react';
import { CompletionRing } from './CompletionRing';
import { SectionNavItem } from './SectionNavItem';
import type { NavSection, ProfileCompletion, SectionId } from './types';

interface SidebarNavigationProps {
  completion: ProfileCompletion;
  sections: NavSection[];
  onSectionClick: (sectionId: SectionId) => void;
  onOpenRepository: () => void;
  onReset: () => void;
  onSave: () => void;
  isDirty: boolean;
  isSaving: boolean;
}

export const SidebarNavigation = ({
  completion,
  sections,
  onSectionClick,
  onOpenRepository,
  onReset,
  onSave,
  isDirty,
  isSaving,
}: SidebarNavigationProps) => {
  return (
    <aside className="lg:sticky lg:top-6 h-fit space-y-4">
      {/* Completion Ring */}
      <Card>
        <CardContent className="p-4">
          <CompletionRing 
            percentage={completion.pct} 
            filled={completion.filled} 
            total={completion.total} 
          />
        </CardContent>
      </Card>

      {/* Section Navigation */}
      <Card>
        <CardContent className="p-3 space-y-1">
          {sections.map((section) => (
            <SectionNavItem
              key={section.id}
              section={section}
              onClick={() => onSectionClick(section.id as SectionId)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={onOpenRepository}
              >
                <Database className="h-4 w-4" />
                Get from Repository
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Look up patient data from hospital database</TooltipContent>
          </Tooltip>

          <Separator />

          <div className="flex gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onReset}
                  disabled={!isDirty}
                  className="flex-1 gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear all fields</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={!isDirty || isSaving}
                  className="flex-1 gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? 'Saving…' : 'Save'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save patient profile</TooltipContent>
            </Tooltip>
          </div>

          {isDirty && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>You have unsaved changes</span>
            </div>
          )}
        </CardContent>
      </Card>
    </aside>
  );
};

export default SidebarNavigation;
