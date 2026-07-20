import { useEffect, useRef, useState } from 'react';
import { CloseIcon, EditIcon } from '../ui/icons/general';
import { ServerIcon, SplitDownIcon, SplitRightIcon } from '../ui/icons/terminal';
import type { Block, LeafNode } from '../../api/types';
import { useLayoutStore } from '../../store/layout';
import { useUiStore } from '../../store/ui';
import { useConnectionsStore, targetName } from '../../store/connections';
import { useFilesNavStore } from '../../store/filesNav';
import { renameBlock } from '../../store/blocks';
import { openContextMenu } from '../../store/contextMenu';
import { ConnectionButton } from '../connections/ConnectionButton';
import { FilesNavButtons, FilesRefreshButton } from '../files/FilesHeaderNav';
import { displayPath } from '../files/format';
import { startBlockDrag } from './blockDrag';

const END_ICON_CLASS =
  'flex w-6 shrink-0 cursor-pointer items-center justify-center px-1.5 py-1 text-fg opacity-70 transition-opacity hover:opacity-100';

/** Wave-exact 30px block header: connection button, optional title, end icons. */
export function BlockHeader({ leaf }: { leaf: LeafNode }) {
  const closeLeaf = useLayoutStore((s) => s.closeLeaf);
  const localName = useLayoutStore((s) => s.localName);
  const openPicker = useUiStore((s) => s.openPicker);
  const connections = useConnectionsStore((s) => s.connections);
  const { block } = leaf;
  const home = useFilesNavStore((s) =>
    block.kind === 'files' ? s.homes[block.target] : undefined,
  );
  // While a file is open in a files block's editor, the header titles with
  // the file's path (name visible) instead of the directory path.
  const openFilePath = useFilesNavStore((s) =>
    block.kind === 'files' ? s.openFiles[leaf.id]?.file.path : undefined,
  );
  const [connOpen, setConnOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag-ghost label: custom title, else target name / path.
  const defaultTitle = (b: Block): string => {
    if (b.kind === 'terminal') {
      return b.target === 'local' ? (localName ?? 'Localhost') : targetName(b.target, connections);
    }
    return displayPath(b.path, home);
  };
  // Title text renders only when the user renamed the block; a files block
  // additionally shows its ~path (that display is the files nav, not a title).
  const title =
    block.title ??
    (block.kind === 'files' ? displayPath(openFilePath ?? block.openFile?.path ?? block.path, home) : '');

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startRename = () => {
    setDraft(block.title ?? '');
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    renameBlock(leaf.id, draft);
  };

  const splitRight = () => openPicker({ mode: 'split', leafId: leaf.id, dir: 'row' });
  const splitDown = () => openPicker({ mode: 'split', leafId: leaf.id, dir: 'col' });

  const headerMenu = (e: React.MouseEvent) =>
    openContextMenu(e, [
      { label: 'Rename Block', icon: <EditIcon size={14} />, onClick: startRename },
      { label: 'Change Connection…', icon: <ServerIcon size={14} />, onClick: () => setConnOpen(true) },
      'separator',
      { label: 'Split Right', icon: <SplitRightIcon size={14} />, onClick: splitRight },
      { label: 'Split Down', icon: <SplitDownIcon size={14} />, onClick: splitDown },
      'separator',
      { label: 'Close Block', icon: <CloseIcon size={14} />, onClick: () => closeLeaf(leaf.id) },
    ]);

  return (
    <div
      className="group/header flex h-[30px] shrink-0 items-center gap-2 border-b border-edge py-1 pr-[5px] pl-2.5 text-[11px] font-bold select-none"
      onContextMenu={headerMenu}
      onPointerDown={(e) => startBlockDrag(e, leaf.id, block.title ?? defaultTitle(block))}
    >
      {block.kind === 'files' && <FilesNavButtons leafId={leaf.id} target={block.target} />}
      <ConnectionButton
        leafId={leaf.id}
        target={block.target}
        open={connOpen}
        setOpen={setConnOpen}
      />
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="min-w-0 flex-1 border-none bg-transparent p-0 text-[11px] font-medium text-fg outline-none"
        />
      ) : (
        // Fills the header even when empty so the blank area double-clicks to rename
        <span
          className="flex min-w-0 flex-1 items-center self-stretch"
          onDoubleClick={startRename}
        >
          {title && (
            <span className="min-w-0 truncate text-[11px] font-medium text-fg opacity-80">
              {title}
            </span>
          )}
        </span>
      )}
      {/* end icons appear only while the pointer is over the header */}
      <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover/header:opacity-100">
        {block.kind === 'files' && (
          <FilesRefreshButton leafId={leaf.id} className={END_ICON_CLASS} />
        )}
        <button type="button" title="Split right" aria-label="Split right" className={END_ICON_CLASS} onClick={splitRight}>
          <SplitRightIcon size={13} />
        </button>
        <button type="button" title="Split down" aria-label="Split down" className={END_ICON_CLASS} onClick={splitDown}>
          <SplitDownIcon size={13} />
        </button>
        <button type="button" title="Close block" aria-label="Close block" className={END_ICON_CLASS} onClick={() => closeLeaf(leaf.id)}>
          <CloseIcon size={13} />
        </button>
      </div>
    </div>
  );
}
