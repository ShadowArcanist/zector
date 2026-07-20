import type { Block } from '../../api/types';
import { useConnectionsStore } from '../../store/connections';
import { useLayoutStore } from '../../store/layout';
import { useUiStore } from '../../store/ui';
import { PlusIcon } from '../ui/icons/general';
import { connColor } from '../connections/colors';
import { connGlyph, localGlyph } from '../connections/icons';
import { Modal } from '../ui/Modal';

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-fg-faint uppercase">
      {children}
    </p>
  );
}

function PickItem({
  icon,
  label,
  onPick,
}: {
  icon: React.ReactNode;
  label: string;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex h-10 w-full cursor-pointer items-center gap-3 rounded-xl px-3 text-left text-[13px] text-fg-dim transition-colors hover:bg-white/8 hover:text-fg"
      onClick={onPick}
    >
      <span className="flex w-4 shrink-0 justify-center text-fg-faint">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

/** One target row: icon + name + Terminal/Files pick buttons. */
function TargetRow({
  icon,
  label,
  onTerminal,
  onFiles,
}: {
  icon: React.ReactNode;
  label: string;
  onTerminal: () => void;
  onFiles: () => void;
}) {
  const btn =
    'h-7 shrink-0 cursor-pointer rounded-lg bg-white/6 px-2.5 text-[12px] text-fg-dim transition-colors hover:bg-white/12 hover:text-fg';
  return (
    <div className="flex h-10 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-white/5">
      <span className="flex w-4 shrink-0 justify-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-fg-dim">{label}</span>
      <button type="button" className={btn} onClick={onTerminal}>
        Terminal
      </button>
      <button type="button" className={btn} onClick={onFiles}>
        Files
      </button>
    </div>
  );
}

/** List of block choices — used inline (empty tab) and inside the split modal. */
export function BlockPickerList({ onPick }: { onPick: (block: Block) => void }) {
  const connections = useConnectionsStore((s) => s.connections);
  const localName = useLayoutStore((s) => s.localName) ?? 'Localhost';
  const localIconKey = useLayoutStore((s) => s.localIcon);
  const localColor = useLayoutStore((s) => s.localColor);
  const openConnections = useUiStore((s) => s.openConnections);

  const term = (target: string): Block => ({
    kind: 'terminal',
    target,
    termId: crypto.randomUUID(),
  });
  const files = (target: string): Block => ({ kind: 'files', target, path: '' });

  return (
    <div className="flex flex-col gap-0.5 px-2 pb-3">
      <SectionLabel>Local</SectionLabel>
      <TargetRow
        icon={localGlyph(localIconKey, {
          size: 14,
          className: 'text-fg-dim',
          style: localColor ? { color: localColor } : undefined,
        })}
        label={localName}
        onTerminal={() => onPick(term('local'))}
        onFiles={() => onPick(files('local'))}
      />
      {connections.length > 0 && <SectionLabel>Connections</SectionLabel>}
      {connections.map((c) => (
        <TargetRow
          key={c.id}
          icon={connGlyph(c, { size: 14, style: { color: connColor(c) } })}
          label={c.name}
          onTerminal={() => onPick(term(c.id))}
          onFiles={() => onPick(files(c.id))}
        />
      ))}
      <div className="mx-1 my-1.5 h-px bg-white/6" />
      <PickItem
        icon={<PlusIcon size={15} />}
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
    <Modal title="Add block" onClose={closePicker} width="w-[380px]" surface="bg-menu">
      <BlockPickerList onPick={handlePick} />
    </Modal>
  );
}
