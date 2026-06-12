'use client';

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface FormErrorAlertProps {
  /** One or more error messages (e.g. from `getApiErrorMessages`). */
  messages: string[];
  className?: string;
}

/**
 * Renders API/validation errors in a consistent destructive alert.
 * A single message shows as a sentence; multiple show as a bulleted list.
 */
export default function FormErrorAlert({ messages, className }: FormErrorAlertProps) {
  if (!messages || messages.length === 0) return null;

  return (
    <Alert variant="destructive" className={cn('border-red-200 bg-red-50', className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-red-800">
        {messages.length === 1 ? (
          messages[0]
        ) : (
          <ul className="list-disc space-y-1 pl-4">
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
