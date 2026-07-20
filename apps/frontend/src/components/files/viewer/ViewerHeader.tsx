import { pushToast } from '../../../store/toast';
import { CloseIcon } from '../../ui/icons/general';
import { CopyIcon, DownloadIcon } from '../../ui/icons/files';
import { fileIconUrl } from '../fileIcons';
import { humanSize } from '../format';

/** Small circular pill icon button for the viewer header bar. */
function PillIconButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/6 text-fg-dim transition-colors hover:bg-white/12 hover:text-fg"
      {...props}
    />
  );
}

/**
 * Viewer header bar (gitbase's FileViewHeader adapted to zector chrome):
 * material file icon + name + "N lines · size", then optional extra controls
 * (`children`, e.g. the SVG Preview/Code toggle), copy-contents, download,
 * close.
 */
export function ViewerHeader({
  name,
  lineCount,
  size,
  copyText,
  onDownload,
  onClose,
  children,
}: {
  name: string;
  lineCount?: number;
  size?: number;
  copyText?: string;
  onDownload: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const copy = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => pushToast('ok', 'File contents copied'))
      .catch(() => pushToast('error', 'Could not copy contents'));
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
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {children}
        {copyText != null && (
          <PillIconButton onClick={() => copy(copyText)} aria-label="Copy file contents" title="Copy contents">
            <CopyIcon size={13} />
          </PillIconButton>
        )}
        <PillIconButton onClick={onDownload} aria-label="Download file" title="Download">
          <DownloadIcon size={13} />
        </PillIconButton>
        <PillIconButton onClick={onClose} aria-label="Close viewer" title="Close">
          <CloseIcon size={13} />
        </PillIconButton>
      </div>
    </div>
  );
}
