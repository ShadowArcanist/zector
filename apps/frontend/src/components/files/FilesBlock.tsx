import { useEffect, useRef, useState } from 'react';
import { EditIcon, RefreshIcon, TrashIcon } from '../ui/icons/general';
import {
  CopyIcon,
  DownloadIcon,
  FileIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  UploadIcon,
} from '../ui/icons/files';
import type { FilesBlockData, FsEntry } from '../../api/types';
import { fsReadUrl } from '../../api/fs';
import { useFilesNavStore } from '../../store/filesNav';
import { pushToast } from '../../store/toast';
import { openContextMenu, type MenuEntry } from '../../store/contextMenu';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { FileTable } from './FileTable';
import { isImageFile, isTextName } from './format';
import { useFiles } from './useFiles';
import { FileViewer } from './viewer/FileViewer';
import { SudoPasswordModal } from './SudoPasswordModal';

function download(target: string, path: string) {
  const a = document.createElement('a');
  a.href = fsReadUrl(target, path, true);
  a.download = '';
  a.click();
}

export function FilesBlock({ leafId, block }: { leafId: string; block: FilesBlockData }) {
  const {
    entries,
    loading,
    error,
    errorStatus,
    uploadState,
    navigate,
    refresh,
    listAsSudo,
    createFile,
    mkdir,
    rename,
    remove,
    upload,
  } = useFiles(leafId, block);
  const [selected, setSelected] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [sudoOpen, setSudoOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Runtime editor state lives in filesNav; block.openFile restores it after reload.
  const openFile = useFilesNavStore((s) => s.openFiles[leafId]?.file ?? null);
  const openFileInEditor = useFilesNavStore((s) => s.openFile);
  const restoreOpenFile = useFilesNavStore((s) => s.restoreOpenFile);
  const closeFile = useFilesNavStore((s) => s.closeFile);

  useEffect(() => {
    if (!openFile && block.openFile) restoreOpenFile(leafId, block.openFile);
  }, [openFile, block.openFile, leafId, restoreOpenFile]);

  // Switching the block's connection while a file is open closes the editor
  // (its buffer belongs to the previous target).
  useEffect(() => {
    if (openFile && openFile.target !== block.target) closeFile(leafId);
  }, [openFile, block.target, leafId, closeFile]);
  const restoredFile = openFile ?? block.openFile ?? null;
  const viewing = restoredFile !== null && restoredFile.target === block.target;

  const open = (entry: FsEntry) => {
    if (entry.is_dir) {
      setSelected(null);
      navigate(entry.path);
    } else if (isImageFile(entry.name) || isTextName(entry.name)) {
      // editor overlay; it handles the too-large fallback itself
      openFileInEditor(leafId, {
        target: block.target,
        path: entry.path,
        name: entry.name,
        size: entry.size,
      });
    } else {
      download(block.target, entry.path);
    }
  };

  const entryMenu = (entry: FsEntry): MenuEntry[] => [
    { label: 'Open', icon: <FolderOpenIcon size={14} />, onClick: () => open(entry) },
    ...(entry.is_dir
      ? []
      : [
          {
            label: 'Download',
            icon: <DownloadIcon size={14} />,
            onClick: () => download(block.target, entry.path),
          },
        ]),
    { label: 'Rename', icon: <EditIcon size={14} />, onClick: () => setRenaming(entry.path) },
    {
      label: 'Copy path',
      icon: <CopyIcon size={14} />,
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
      icon: <TrashIcon size={14} />,
      danger: true,
      onClick: () => {
        if (window.confirm(`Delete "${entry.name}"?${entry.is_dir ? ' (recursive)' : ''}`)) {
          void remove(entry.path);
        }
      },
    },
  ];

  const listMenu = (e: React.MouseEvent) =>
    openContextMenu(e, [
      {
        label: 'New File',
        icon: <FileIcon size={14} />,
        onClick: () => {
          setCreatingFolder(false);
          setCreatingFile(true);
        },
      },
      {
        label: 'New Folder',
        icon: <FolderPlusIcon size={14} />,
        onClick: () => {
          setCreatingFile(false);
          setCreatingFolder(true);
        },
      },
      {
        label: 'Upload Files…',
        icon: <UploadIcon size={14} />,
        onClick: () => fileInputRef.current?.click(),
      },
      'separator',
      { label: 'Refresh', icon: <RefreshIcon size={14} />, onClick: refresh },
    ]);

  return (
    <div
      className="absolute inset-0 flex flex-col"
      onDragOver={(e) => {
        if (viewing) return;
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
      {/* the table unmounts while a file is open so a transparent editor
          surface shows the tab background, not the listing beneath */}
      {viewing ? (
        <FileViewer leafId={leafId} file={restoredFile!} />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8">
          <p className="text-center text-[12px] text-danger">{error}</p>
          {block.target === 'local' && errorStatus === 403 ? (
            <Button size="sm" variant="primary" onClick={() => setSudoOpen(true)}>Try as sudo</Button>
          ) : (
            <Button size="sm" onClick={refresh}>Retry</Button>
          )}
        </div>
      ) : (
        <FileTable
          leafId={leafId}
          path={block.path}
          entries={entries}
          selected={selected}
          renaming={renaming}
          creatingFile={creatingFile}
          creatingFolder={creatingFolder}
          onSelect={(entry) => setSelected(entry?.path ?? null)}
          onOpen={open}
          onEntryMenu={(entry, e) => {
            setSelected(entry.path);
            openContextMenu(e, entryMenu(entry));
          }}
          onEmptyMenu={listMenu}
          onRenameCommit={(entry, name) => {
            setRenaming(null);
            void rename(entry.path, name);
          }}
          onRenameCancel={() => setRenaming(null)}
          onCreateFile={(name) => {
            setCreatingFile(false);
            void createFile(name).then((path) => {
              if (!path) return;
              openFileInEditor(leafId, {
                target: block.target,
                path,
                name,
                size: 0,
              });
            });
          }}
          onCreateFileCancel={() => setCreatingFile(false)}
          onMkdir={(name) => {
            setCreatingFolder(false);
            void mkdir(name);
          }}
          onMkdirCancel={() => setCreatingFolder(false)}
        />
      )}
      {(loading || uploadState) && (
        <div className="pointer-events-none absolute right-2 bottom-1.5 z-10 flex items-center gap-1.5 rounded bg-black/50 px-2 py-0.5 text-[11px] text-fg-faint">
          <Spinner size={11} className={uploadState ? 'text-accent' : undefined} />
          {uploadState && (
            <span className="text-accent">
              {uploadState.current}/{uploadState.total} {uploadState.name}
            </span>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          void upload(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-accent/70 bg-accent/10">
          <span className="rounded-md bg-bg0/90 px-3 py-1.5 text-[12px] text-accent">
            Drop files to upload
          </span>
        </div>
      )}
      {sudoOpen && (
        <SudoPasswordModal
          path={block.path}
          onClose={() => setSudoOpen(false)}
          onSubmit={listAsSudo}
        />
      )}
    </div>
  );
}
