import { Folder, Plus, Server, Terminal } from 'lucide-react';
import type { Block } from '../../api/types';
import { useConnectionsStore } from '../../store/connections';
import { useLayoutStore } from '../../store/layout';
import { useUiStore } from '../../store/ui';
import { Modal } from '../ui/Modal';

function PickRow({
  icon,
  label,
  hint,
  onPick,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-[12px] text-fg-dim transition-colors hover:bg-hover hover:text-fg"
      onClick={onPick}
    >
      <span className="text-fg-faint">{icon}</span>
      <span className="flex-1">{label}</span>
      {hint && <span className="text-[11px] text-fg-faint">{hint}</span>}
    </button>
  );
}

/** List of block choices — used inline (empty tab) and inside the split modal. */
export function BlockPickerList({ onPick }: { onPick: (block: Block) => void }) {
  const connections = useConnectionsStore((s) => s.connections);
  const openConnections = useUiStore((s) => s.openConnections);

  const term = (target: string): Block => ({
    kind: 'terminal',
    target,
    termId: crypto.randomUUID(),
  });
  const files = (target: string): Block => ({ kind: 'files', target, path: '' });

  return (
    <div className="flex flex-col gap-0.5 p-2">
      <PickRow icon={<Terminal size={14} />} label="Terminal — Local" onPick={() => onPick(term('local'))} />
      <PickRow icon={<Folder size={14} />} label="Files — Local" onPick={() => onPick(files('local'))} />
      {connections.length > 0 && <div className="mx-2 my-1 h-px bg-white/8" />}
      {connections.map((c) => (
        <div key={c.id} className="flex items-center gap-0.5">
          <span className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-1 text-[12px] text-fg-dim">
            <Server size={14} className="shrink-0 text-fg-faint" />
            <span className="truncate">{c.name}</span>
          </span>
          <button
            type="button"
            className="cursor-pointer rounded px-2 py-1 text-[12px] text-fg-faint transition-colors hover:bg-hover hover:text-fg"
            onClick={() => onPick(term(c.id))}
          >
            Terminal
          </button>
          <button
            type="button"
            className="cursor-pointer rounded px-2 py-1 text-[12px] text-fg-faint transition-colors hover:bg-hover hover:text-fg"
            onClick={() => onPick(files(c.id))}
          >
            Files
          </button>
        </div>
      ))}
      <div className="mx-2 my-1 h-px bg-white/8" />
      <PickRow
        icon={<Plus size={14} />}
        label="New SSH connection…"
        onPick={() => openConnections('new')}
      />
    </div>
  );
}

/** Modal picker shown when splitting an existing block. */
export function BlockPickerModal() {
  const picker = useUiStore((s) => s.picker);
  const closePicker = useUiStore((s) => s.closePicker);
  const splitLeaf = useLayoutStore((s) => s.splitLeaf);
  const setTabRoot = useLayoutStore((s) => s.setTabRoot);

  if (!picker) return null;

  const handlePick = (block: Block) => {
    if (picker.mode === 'split') splitLeaf(picker.leafId, picker.dir, block);
    else setTabRoot(picker.tabId, block);
    closePicker();
  };

  return (
    <Modal title="Add block" onClose={closePicker} width="w-90">
      <BlockPickerList onPick={handlePick} />
    </Modal>
  );
}
