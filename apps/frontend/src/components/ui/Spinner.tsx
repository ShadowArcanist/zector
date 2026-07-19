import { LoaderCircle } from 'lucide-react';

export function Spinner({ size = 14, className = '' }: { size?: number; className?: string }) {
  return <LoaderCircle size={size} className={`animate-spin text-fg-dim ${className}`} />;
}
