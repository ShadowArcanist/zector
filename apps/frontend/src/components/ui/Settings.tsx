import type { ReactNode } from 'react';

/** 18px semibold pane title for settings-style dialogs. */
export function SettingsTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4 pb-3">
      <h2 className="min-w-0 truncate text-[18px] font-semibold text-fg">{children}</h2>
      {right}
    </div>
  );
}

/** One settings row: label + optional muted description left, control right. */
export function SettingsRow({
  label,
  description,
  htmlFor,
  children,
}: {
  label: ReactNode;
  description?: ReactNode;
  htmlFor?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-[48px] items-center justify-between gap-4 px-5 py-2">
      <div className="min-w-0">
        <label className="block text-[14px] text-fg" htmlFor={htmlFor}>
          {label}
        </label>
        {description && <p className="mt-0.5 text-[12px] text-fg-faint">{description}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}

/** Hairline divider between settings rows. */
export function SettingsDivider() {
  return <div className="mx-5 h-px shrink-0 bg-white/6" />;
}

/** iOS-style segmented pill select (e.g. password / key auth). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-lg bg-black/25 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`h-7 cursor-pointer rounded-[7px] px-3 text-[12px] font-medium transition-colors ${
            value === opt.value
              ? 'bg-white/12 text-fg shadow-[0_1px_2px_rgba(0,0,0,0.3)]'
              : 'text-fg-faint hover:text-fg-dim'
          }`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
