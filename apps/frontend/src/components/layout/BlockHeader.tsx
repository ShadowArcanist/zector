import { useEffect, useRef, useState } from 'react';
import {
  Folder,
  Pencil,
  Server,
  SquareSplitHorizontal,
  SquareSplitVertical,
  Terminal as TerminalIcon,
  X,
} from 'lucide-react';
import type { Block, LeafNode } from '../../api/types';
import { useLayoutStore } from '../../store/layout';
import { useUiStore } from '../../store/ui';
import { renameBlock } from '../../store/blocks';
import { openContextMenu } from '../../store/contextMenu';
import { ConnectionButton } from '../connections/ConnectionButton';

function basename(path: string): string {
  const trimmed = path.replace(/\/+$/, '');
  if (!trimmed) return '/';
  return trimmed.slice(trimmed.lastIndexOf('/') + 1) || '/';
}

function defaultTitle(block: Block): string {
  if (block.kind === 'terminal') return 'terminal';
  return block.path ? basename(block.path) : 'files';
}

const END_ICON_CLASS =
  'flex w-6 shrink-0 cursor-pointer items-center justify-center px-1.5 py-1 text-fg opacity-70 transition-opacity hover:opacity-100';

/** Wave-exact 30px block header: view icon, connection button, title, end icons. */
export function BlockHeader({ leaf }: { leaf: LeafNode }) {
  const closeLeaf = useLayoutStore((s) => s.closeLeaf);
  const openPicker = useUiStore((s) => s.openPicker);
  const [connOpen, setConnOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { block } = leaf;
  const title = block.title ?? defaultTitle(block);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startRename = () => {
    setDraft(block.title ?? defaultTitle(block));
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
      { label: 'Rename Block', icon: <Pencil size={13} />, onClick: startRename },
      { label: 'Change Connection…', icon: <Server size={13} />, onClick: () => setConnOpen(true) },
      'separator',
      { label: 'Split Right', icon: <SquareSplitHorizontal size={13} />, onClick: splitRight },
      { label: 'Split Down', icon: <SquareSplitVertical size={13} />, onClick: splitDown },
      'separator',
      { label: 'Close Block', icon: <X size={13} />, onClick: () => closeLeaf(leaf.id) },
    ]);

  return (
    <div
      className="flex h-[30px] shrink-0 items-center gap-2 border-b border-edge py-1 pr-[5px] pl-[7px] text-[11px] font-bold select-none"
      onContextMenu={headerMenu}
    >
      <span className="flex w-4 shrink-0 justify-center opacity-50">
        {block.kind === 'terminal' ? <TerminalIcon size={14} /> : <Folder size={14} />}
      </span>
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
        <span
          className="min-w-0 flex-1 truncate text-[11px] font-medium opacity-70"
          onDoubleClick={startRename}
        >
          {title}
        </span>
      )}
      <div className="flex shrink-0 items-center">
        <button type="button" title="Split right" aria-label="Split right" className={END_ICON_CLASS} onClick={splitRight}>
          <SquareSplitHorizontal size={13} />
        </button>
        <button type="button" title="Split down" aria-label="Split down" className={END_ICON_CLASS} onClick={splitDown}>
          <SquareSplitVertical size={13} />
        </button>
        <button type="button" title="Close block" aria-label="Close block" className={END_ICON_CLASS} onClick={() => closeLeaf(leaf.id)}>
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
