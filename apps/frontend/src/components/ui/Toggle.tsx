type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
};

/** iOS-style switch: pill track, white knob, accent when on. */
export function Toggle({ checked, onChange, disabled = false, ...rest }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`relative h-[26px] w-[44px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-default disabled:opacity-50 ${
        checked ? 'bg-accent' : 'bg-white/15'
      }`}
      onClick={() => onChange(!checked)}
      {...rest}
    >
      <span
        className={`absolute top-[3px] left-[3px] block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.4)] transition-transform duration-200 ${
          checked ? 'translate-x-[18px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
