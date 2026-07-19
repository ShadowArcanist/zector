import { useState } from 'react';
import { Copy, Download, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import type { FilesBlockData, FsEntry } from '../../api/types';
import { fsReadUrl } from '../../api/fs';
import { pushToast } from '../../store/toast';
import { openContextMenu, type MenuEntry } from '../../store/contextMenu';
import { Button } from '../ui/Button';
import { EditorOverlay, ImageOverlay } from './FileOverlays';
import { FileList } from './FileList';
import { FilesToolbar } from './FilesToolbar';
import { isImageFile, isTextFile } from './format';
import { useFiles } from './useFiles';

type Overlay = { kind: 'image' | 'editor'; path: string } | null;

function download(target: string, path: string) {
  const a = document.createElement('a');
  a.href = fsReadUrl(target, path, true);
  a.download = '';
  a.click();
}

export function FilesBlock({ leafId, block }: { leafId: string; block: FilesBlockData }) {
  const { entries, loading, error, uploadState, navigate, refresh, mkdir, rename, remove, upload } =
    useFiles(leafId, block);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [dragOver, setDragOver] = useState(false);

  const open = (entry: FsEntry) => {
    if (entry.is_dir) {
      setSelected(null);
      navigate(entry.path);
    } else if (isImageFile(entry.name)) {
      setOverlay({ kind: 'image', path: entry.path });
    } else if (isTextFile(entry.name, entry.size)) {
      setOverlay({ kind: 'editor', path: entry.path });
    } else {
      download(block.target, entry.path);
    }
  };

  const menuItems = (entry: FsEntry): MenuEntry[] => [
    { label: 'Open', icon: <FolderOpen size={13} />, onClick: () => open(entry) },
    ...(entry.is_dir
      ? []
      : [
          {
            label: 'Download',
            icon: <Download size={13} />,
            onClick: () => download(block.target, entry.path),
          },
        ]),
    { label: 'Rename', icon: <Pencil size={13} />, onClick: () => setRenaming(entry.path) },
    {
      label: 'Copy path',
      icon: <Copy size={13} />,
      onClick: () => {
        navigator.clipboard
          .writeText(entry.path)
          .then(() => pushToast('ok', 'Path copied'))
          .catch(() => pushToast('error', 'Could not copy path'));
      },
    },
    'separator',
    {
      label: 'Delete',
      icon: <Trash2 size={13} />,
      danger: true,
      onClick: () => {
        if (window.confirm(`Delete "${entry.name}"?${entry.is_dir ? ' (recursive)' : ''}`)) {
          void remove(entry.path);
        }
      },
    },
  ];

  return (
    <div
      className="absolute inset-0 flex flex-col"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as globalThis.Node)) setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        void upload(Array.from(e.dataTransfer.files));
      }}
    >
      <FilesToolbar
        path={block.path}
        loading={loading}
        uploadState={uploadState}
        onNavigate={(p) => {
          setSelected(null);
          navigate(p);
        }}
        onRefresh={refresh}
        onMkdir={(name) => void mkdir(name)}
        onUpload={(files) => void upload(files)}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {error ? (
          <div className="flex flex-col items-center gap-3 px-4 py-8">
            <p className="text-center text-[12px] text-danger">{error}</p>
            <Button size="sm" onClick={refresh}>Retry</Button>
          </div>
        ) : (
          <FileList
            entries={entries}
            selected={selected}
            renaming={renaming}
            onSelect={(entry) => setSelected(entry.path)}
            onOpen={open}
            onContextMenu={(entry, e) => {
              setSelected(entry.path);
              openContextMenu(e, menuItems(entry));
            }}
            onRenameCommit={(entry, name) => {
              setRenaming(null);
              void rename(entry.path, name);
            }}
            onRenameCancel={() => setRenaming(null)}
          />
        )}
      </div>
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-accent/70 bg-accent/10">
          <span className="rounded-md bg-bg0/90 px-3 py-1.5 text-[12px] text-accent">
            Drop files to upload
          </span>
        </div>
      )}
      {overlay?.kind === 'image' && (
        <ImageOverlay target={block.target} path={overlay.path} onClose={() => setOverlay(null)} />
      )}
      {overlay?.kind === 'editor' && (
        <EditorOverlay target={block.target} path={overlay.path} onClose={() => setOverlay(null)} />
      )}
    </div>
  );
}
