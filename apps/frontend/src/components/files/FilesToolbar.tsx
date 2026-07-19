import { useRef, useState } from 'react';
import { ArrowUp, ChevronRight, FolderPlus, RefreshCw, Upload } from 'lucide-react';
import { IconButton } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { breadcrumbs, parentPath } from './format';
import type { UploadState } from './useFiles';

type Props = {
  path: string;
  loading: boolean;
  uploadState: UploadState;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  onMkdir: (name: string) => void;
  onUpload: (files: File[]) => void;
};

export function FilesToolbar({
  path,
  loading,
  uploadState,
  onNavigate,
  onRefresh,
  onMkdir,
  onUpload,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newFolder, setNewFolder] = useState<string | null>(null);
  const crumbs = breadcrumbs(path);
  // keep breadcrumb compact: root + last 3 segments
  const shown = crumbs.length > 4 ? [crumbs[0], ...crumbs.slice(-3)] : crumbs;
  const elided = crumbs.length > 4;

  return (
    <div className="flex h-8 shrink-0 items-center gap-1 border-b border-white/8 px-1.5">
      <IconButton title="Up one directory" aria-label="Up" onClick={() => onNavigate(parentPath(path))}>
        <ArrowUp size={13} />
      </IconButton>
      <div className="flex min-w-0 flex-1 items-center overflow-hidden font-mono text-[11px] whitespace-nowrap text-fg-dim">
        {shown.map((crumb, i) => (
          <span key={crumb.path} className="flex min-w-0 items-center">
            {i > 0 && <ChevronRight size={10} className="mx-0.5 shrink-0 text-fg-faint" />}
            {i === 1 && elided && <span className="mr-0.5 text-fg-faint">…</span>}
            <button
              type="button"
              className="cursor-pointer truncate rounded px-1 py-0.5 transition-colors hover:bg-hover hover:text-fg"
              onClick={() => onNavigate(crumb.path)}
            >
              {crumb.label}
            </button>
          </span>
        ))}
      </div>
      {uploadState && (
        <span className="flex items-center gap-1.5 text-[11px] text-accent">
          <Spinner size={11} className="text-accent" />
          {uploadState.current}/{uploadState.total} {uploadState.name}
        </span>
      )}
      {loading && !uploadState && <Spinner size={12} />}
      {newFolder !== null ? (
        <input
          autoFocus
          value={newFolder}
          placeholder="folder name"
          className="h-6 w-32 rounded-[2px] border border-white/18 bg-black/30 px-1.5 text-xs text-fg outline-none focus:border-accent"
          onChange={(e) => setNewFolder(e.target.value)}
          onBlur={() => setNewFolder(null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newFolder.trim()) {
              onMkdir(newFolder.trim());
              setNewFolder(null);
            }
            if (e.key === 'Escape') setNewFolder(null);
          }}
        />
      ) : (
        <IconButton title="New folder" aria-label="New folder" onClick={() => setNewFolder('')}>
          <FolderPlus size={13} />
        </IconButton>
      )}
      <IconButton title="Upload files" aria-label="Upload files" onClick={() => fileInputRef.current?.click()}>
        <Upload size={13} />
      </IconButton>
      <IconButton title="Refresh" aria-label="Refresh" onClick={onRefresh}>
        <RefreshCw size={13} />
      </IconButton>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          onUpload(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
    </div>
  );
}
