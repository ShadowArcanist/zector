import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle';

const styles: Record<Variant, string> = {
  primary:
    'bg-accent-dim hover:bg-accent text-white border border-transparent',
  ghost:
    'bg-transparent hover:bg-bg3 text-fg-dim hover:text-fg border border-edge2',
  subtle: 'bg-transparent hover:bg-bg3 text-fg-dim hover:text-fg border border-transparent',
  danger: 'bg-transparent hover:bg-danger/15 text-danger border border-danger/40',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md';
};

export function Button({ variant = 'ghost', size = 'md', className = '', ...rest }: Props) {
  const sizing = size === 'sm' ? 'h-6 px-2 text-xs' : 'h-8 px-3 text-[13px]';
  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-default disabled:opacity-50 ${sizing} ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}

/** Tiny square icon button for block headers / toolbars. */
export function IconButton({
  className = '',
  danger = false,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex h-5.5 w-5.5 shrink-0 cursor-pointer items-center justify-center rounded transition-colors outline-none focus-visible:ring-1 focus-visible:ring-accent ${
        danger ? 'text-fg-faint hover:bg-danger/20 hover:text-danger' : 'text-fg-faint hover:bg-bg3 hover:text-fg'
      } ${className}`}
      {...rest}
    />
  );
}
