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
  return <div className="mx-5 h-px shrink-0 bg-white/4" />;
}

