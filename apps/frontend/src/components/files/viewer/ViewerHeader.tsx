import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CloseIcon } from '../../ui/icons/general';
import { CopyIcon, DownloadIcon, SaveIcon } from '../../ui/icons/files';
import { fileIconUrl } from '../fileIcons';
import { humanSize } from '../format';

/** Square icon button for the viewer header bar. */
function HeaderIconButton({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-white/8 text-fg-dim transition-colors hover:bg-white/14 hover:text-fg ${className}`}
      {...props}
    />
  );
}

/** Preview/Code segmented toggle for SVG files. */
export function SvgToggle({ mode, onChange }: { mode: 'preview' | 'code'; onChange: (m: 'preview' | 'code') => void }) {
  const seg = (m: 'preview' | 'code', label: string) => (
    <button
      type="button"
      onClick={() => onChange(m)}
      className={`h-7 cursor-pointer px-2.5 text-[11px] transition-colors ${
        mode === m ? 'bg-white/12 text-fg' : 'text-fg-dim hover:text-fg'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex shrink-0 items-center overflow-hidden rounded-full bg-white/6">
      {seg('preview', 'Preview')}
      {seg('code', 'Code')}
    </div>
  );
}

/**
 * Editor header bar: material file icon + name + "N lines · size", optional
 * extra controls (`children`, e.g. the SVG toggle), Save (only when dirty),
 * copy-contents (brief check feedback), download, close.
 */
export function ViewerHeader({
  name,
  lineCount,
  size,
  copyText,
  dirty = false,
  saving = false,
  onSave,
  onDownload,
  onClose,
  children,
}: {
  name: string;
  lineCount?: number;
  size?: number;
  copyText?: string;
  dirty?: boolean;
  saving?: boolean;
  onSave?: () => void;
  onDownload: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const copy = (text: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      clearTimeout(copiedTimer.current);
      copiedTimer.current = setTimeout(() => setCopied(false), 1200);
    });
  };

  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/6 px-3">
      <img src={fileIconUrl(name, false)} alt="" aria-hidden draggable={false} className="h-4 w-4 shrink-0 select-none" />
      <span className="min-w-0 truncate text-[12px] font-medium text-fg">{name}</span>
      {lineCount != null && (
        <span className="shrink-0 text-[11px] text-fg-faint">
          {lineCount} {lineCount === 1 ? 'line' : 'lines'}
        </span>
      )}
      {lineCount != null && size != null && (
        <span aria-hidden className="shrink-0 text-[11px] text-fg-faint">
          ·
        </span>
      )}
      {size != null && <span className="shrink-0 text-[11px] text-fg-faint">{humanSize(size)}</span>}
      <div className="ml-auto flex shrink-0 items-center gap-1">
        {children}
        {dirty && onSave && (
          <HeaderIconButton
            disabled={saving}
            onClick={onSave}
            aria-label="Save file"
            title="Save"
            className="bg-[#4d55cc] text-white hover:bg-[#5a63e0] hover:text-white"
          >
            <SaveIcon size={11} />
          </HeaderIconButton>
        )}
        {copyText != null && (
          <HeaderIconButton onClick={() => copy(copyText)} aria-label="Copy file contents" title="Copy contents">
            {copied ? <CheckIcon size={11} className="text-ok" /> : <CopyIcon size={11} />}
          </HeaderIconButton>
        )}
        <HeaderIconButton onClick={onDownload} aria-label="Download file" title="Download">
          <DownloadIcon size={11} />
        </HeaderIconButton>
        <HeaderIconButton onClick={onClose} aria-label="Close editor" title="Close">
          <CloseIcon size={11} />
        </HeaderIconButton>
      </div>
    </div>
  );
}
