import { useState } from 'react';

export type ToastTone = 'teal' | 'coral';

export function useToast() {
  const [toast, setToast] = useState<{ message: string; tone: 'teal' | 'coral' } | null>(null);
  const show = (message: string, tone: ToastTone = 'teal') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 2600);
  };
  return { toast, show };
}
