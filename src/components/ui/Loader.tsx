import { Loader2 } from 'lucide-react';

export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10" role="status" aria-live="polite">
      <Loader2 className="animate-spin text-teal" size={32} />
      {label && <p className="text-sm text-muted dark:text-mist">{label}</p>}
    </div>
  );
}
