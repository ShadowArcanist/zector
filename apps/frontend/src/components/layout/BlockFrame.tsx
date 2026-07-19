import { Folder, SquareSplitHorizontal, SquareSplitVertical, Terminal, X } from 'lucide-react';
import type { LeafNode } from '../../api/types';
import { useLayoutStore } from '../../store/layout';
import { useConnectionsStore, targetName } from '../../store/connections';
import { useUiStore } from '../../store/ui';
import { IconButton } from '../ui/Button';
import { TerminalBlock } from '../terminal/TerminalBlock';
import { FilesBlock } from '../files/FilesBlock';

export function BlockFrame({ leaf }: { leaf: LeafNode }) {
  const focused = useLayoutStore((s) => s.focusedLeafId === leaf.id);
  const setFocusedLeaf = useLayoutStore((s) => s.setFocusedLeaf);
  const closeLeaf = useLayoutStore((s) => s.closeLeaf);
  const openPicker = useUiStore((s) => s.openPicker);
  const connections = useConnectionsStore((s) => s.connections);

  const { block } = leaf;
  const isTerm = block.kind === 'terminal';
  const title = `${isTerm ? 'terminal' : 'files'} — ${targetName(block.target, connections)}`;

  return (
    <section
      className={`group/block flex h-full w-full min-w-0 flex-col overflow-hidden bg-bg1 ${
        focused ? 'ring-1 ring-accent/50 ring-inset' : ''
      }`}
      onMouseDownCapture={() => setFocusedLeaf(leaf.id)}
    >
      <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-edge bg-bg2/60 px-2">
        {isTerm ? (
          <Terminal size={12} className="shrink-0 text-fg-faint" />
        ) : (
          <Folder size={12} className="shrink-0 text-fg-faint" />
        )}
        <span className="min-w-0 truncate font-mono text-[11px] text-fg-dim select-none">
          {title}
        </span>
        <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover/block:opacity-100 group-focus-within/block:opacity-100">
          <IconButton
            title="Split right"
            aria-label="Split right"
            onClick={() => openPicker({ mode: 'split', leafId: leaf.id, dir: 'row' })}
          >
            <SquareSplitHorizontal size={13} />
          </IconButton>
          <IconButton
            title="Split down"
            aria-label="Split down"
            onClick={() => openPicker({ mode: 'split', leafId: leaf.id, dir: 'col' })}
          >
            <SquareSplitVertical size={13} />
          </IconButton>
          <IconButton title="Close block" aria-label="Close block" danger onClick={() => closeLeaf(leaf.id)}>
            <X size={13} />
          </IconButton>
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        {block.kind === 'terminal' ? (
          <TerminalBlock leafId={leaf.id} block={block} />
        ) : (
          <FilesBlock leafId={leaf.id} block={block} />
        )}
      </div>
    </section>
  );
}
