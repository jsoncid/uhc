/**
 * StatusMessage - Floating status notification component
 */
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { StatusType } from './types';

interface StatusMessageProps {
  message: string;
  type: StatusType;
  onDismiss: () => void;
}

export const StatusMessage = ({ message, type, onDismiss }: StatusMessageProps) => {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg animate-in slide-in-from-top-2 ${
      type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
      type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
      'bg-blue-50 border border-blue-200 text-blue-700'
    }`}>
      {type === 'success' ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : type === 'error' ? (
        <AlertCircle className="h-4 w-4 shrink-0" />
      ) : (
        <Info className="h-4 w-4 shrink-0" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 rounded-full p-1 hover:bg-black/5 transition-colors"
        title="Dismiss"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default StatusMessage;
