/**
 * CompletionRing - Visual indicator showing profile completion progress
 */
interface CompletionRingProps {
  percentage: number;
  filled: number;
  total: number;
}

export const CompletionRing = ({ percentage, filled, total }: CompletionRingProps) => {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="relative h-12 w-12">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            className="stroke-muted"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            className={`transition-all duration-700 ease-out ${
              percentage >= 80 ? 'stroke-green-500' : percentage >= 50 ? 'stroke-amber-500' : 'stroke-primary'
            }`}
            strokeWidth="3"
            strokeDasharray={`${percentage * 0.88} 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
          percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-primary'
        }`}>
          {percentage}%
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Completion</p>
        <p className="text-xs text-muted-foreground">
          {filled} of {total} fields
        </p>
      </div>
    </div>
  );
};

export default CompletionRing;
