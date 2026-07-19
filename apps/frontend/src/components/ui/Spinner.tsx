import { LoaderIcon } from './icons/general';

export function Spinner({ size = 14, className = '' }: { size?: number; className?: string }) {
  return <LoaderIcon size={size} className={`animate-spin text-fg-dim ${className}`} />;
}
