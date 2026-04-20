/**
 * Process Stepper - Visual step-by-step guide component
 */

import { LucideIcon, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { cn } from 'src/lib/utils';

interface Step {
  number?: number;
  icon?: LucideIcon;
  title: string;
  description: string;
  color: 'blue' | 'purple' | 'emerald' | 'amber' | 'green';
}

interface ProcessStepperProps {
  title?: string;
  steps: Step[];
  currentStep?: number;
  showProgress?: boolean;
  className?: string;
}

const stepColors = {
  blue: {
    bg: 'bg-blue-500/10',
    ring: 'ring-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    accent: 'bg-blue-500',
  },
  purple: {
    bg: 'bg-purple-500/10',
    ring: 'ring-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
    accent: 'bg-purple-500',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    accent: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    accent: 'bg-amber-500',
  },
  green: {
    bg: 'bg-green-500/10',
    ring: 'ring-green-500/20',
    text: 'text-green-600 dark:text-green-400',
    accent: 'bg-green-500',
  },
};

export function ProcessStepper({
  title,
  steps,
  currentStep = 0,
  showProgress = false,
  className,
}: ProcessStepperProps) {
  return (
    <Card className={cn('border-2', className)}>
      {title && (
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? '' : 'pt-6'}>
        {/* Progress bar */}
        {showProgress && currentStep > 0 && (
          <div className="relative h-1.5 bg-muted rounded-full mb-8 overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        )}
        
        {/* Steps */}
        <div className="flex items-start justify-between gap-2">
          {steps.map((step, index) => {
            const colors = stepColors[step.color];
            const isCompleted = currentStep > index + 1;
            const isCurrent = currentStep === index + 1;
            
            return (
              <div key={index} className="contents">
                {/* Step */}
                <div className="flex flex-col items-center gap-3 flex-1">
                  <div className={cn(
                    'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center',
                    'ring-4 transition-all duration-300',
                    colors.bg,
                    colors.ring,
                    isCurrent && 'scale-110 shadow-lg'
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className={cn('h-6 w-6 sm:h-7 sm:w-7', colors.text)} />
                    ) : step.icon ? (
                      <step.icon className={cn('h-6 w-6 sm:h-7 sm:w-7', colors.text)} />
                    ) : (
                      <span className={cn('text-lg sm:text-xl font-bold', colors.text)}>
                        {step.number || index + 1}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Arrow (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="flex items-center pt-4 sm:pt-5">
                    <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProcessStepper;
