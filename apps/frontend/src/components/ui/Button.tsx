import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'blurple' | 'ghost' | 'danger' | 'subtle';

const styles: Record<Variant, string> = {
  primary: 'bg-accent hover:bg-accent/85 text-bg0 border border-transparent',
  blurple: 'bg-[#4d55cc] hover:bg-[#5a63e0] text-white border border-transparent',
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
      className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-medium transition-[color,background-color,border-color,transform] active:scale-[0.97] outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-default disabled:opacity-50 disabled:active:scale-100 ${sizing} ${styles[variant]} ${className}`}
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
      className={`inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-[color,opacity,background-color,transform] active:scale-90 outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:active:scale-100 ${
        danger
          ? 'text-fg-dim opacity-70 hover:text-danger hover:opacity-100'
          : 'text-fg-dim opacity-70 hover:text-fg hover:opacity-100'
      } ${className}`}
      {...rest}
    />
  );
}
