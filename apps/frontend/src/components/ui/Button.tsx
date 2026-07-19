import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'white' | 'ghost' | 'danger' | 'subtle';

const styles: Record<Variant, string> = {
  primary: 'bg-accent hover:bg-accent/85 text-bg0 border border-transparent',
  white: 'bg-white hover:bg-white/85 text-black border border-transparent',
  ghost: 'bg-white/8 hover:bg-white/12 text-fg border border-transparent',
  subtle: 'bg-transparent hover:bg-hover text-fg-dim hover:text-fg border border-transparent',
  danger: 'bg-danger/10 hover:bg-danger/20 text-danger border border-transparent',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md';
};

export function Button({ variant = 'ghost', size = 'md', className = '', ...rest }: Props) {
  const sizing = size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-9 px-4 text-[13px]';
  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-default disabled:opacity-50 ${sizing} ${styles[variant]} ${className}`}
      {...rest}
    />
  );
}

/** Tiny square icon button for toolbars (Wave iconbutton: no bg, opacity ramp). */
export function IconButton({
  className = '',
  danger = false,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className={`inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-opacity outline-none focus-visible:ring-1 focus-visible:ring-accent ${
        danger
          ? 'text-fg-dim opacity-70 hover:text-danger hover:opacity-100'
          : 'text-fg-dim opacity-70 hover:text-fg hover:opacity-100'
      } ${className}`}
      {...rest}
    />
  );
}
