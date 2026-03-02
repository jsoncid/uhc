/**
 * Patient Card Skeleton - Loading placeholder for patient cards
 */

import { Card, CardContent } from 'src/components/ui/card';
import { Skeleton } from 'src/components/ui/skeleton';

interface PatientCardSkeletonProps {
  count?: number;
  variant?: 'default' | 'compact';
}

export function PatientCardSkeleton({ count = 3, variant = 'default' }: PatientCardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse border-2">
          <CardContent className={variant === 'compact' ? 'p-3' : 'p-4'}>
            <div className="flex items-start gap-4">
              {/* Avatar skeleton */}
              <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
              
              <div className="flex-1 space-y-3">
                {/* Name and badge row */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                
                {/* Details row */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
                
                {/* Additional info */}
                {variant === 'default' && (
                  <Skeleton className="h-3 w-32" />
                )}
              </div>
              
              {/* Action button skeleton */}
              <Skeleton className="h-9 w-24 rounded-md flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </td>
          <td className="p-3"><Skeleton className="h-4 w-16" /></td>
          <td className="p-3"><Skeleton className="h-4 w-24" /></td>
          <td className="p-3"><Skeleton className="h-4 w-32" /></td>
          <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
          <td className="p-3"><Skeleton className="h-8 w-8 rounded-md" /></td>
        </tr>
      ))}
    </>
  );
}

export default PatientCardSkeleton;
