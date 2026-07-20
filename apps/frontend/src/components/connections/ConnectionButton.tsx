import { useRef } from 'react';
import { LaptopIcon } from '../ui/icons/terminal';
import { useConnectionsStore } from '../../store/connections';
import { useLayoutStore } from '../../store/layout';
import { useUiStore } from '../../store/ui';
import { switchBlockTarget } from '../../store/blocks';
import { connColor } from './colors';
import { connGlyph } from './icons';
import { ConnectionDropdown } from './ConnectionDropdown';

type Props = {
  leafId: string;
  target: string;
  open: boolean;
  setOpen: (open: boolean) => void;
};

/** Wave-style connection button shown in every block header. */
export function ConnectionButton({ leafId, target, open, setOpen }: Props) {
  const connections = useConnectionsStore((s) => s.connections);
  const localName = useLayoutStore((s) => s.localName) ?? 'Localhost';
  const openConnections = useUiStore((s) => s.openConnections);
  const btnRef = useRef<HTMLButtonElement>(null);

  const conn = target === 'local' ? null : (connections.find((c) => c.id === target) ?? null);
  const name = target === 'local' ? localName : (conn?.name ?? 'unknown host');

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        title={conn ? `${conn.username}@${conn.host}` : name}
        className="flex max-w-40 shrink-0 cursor-pointer items-center gap-1.5 rounded-[2px] px-1 py-0.5 text-[11px] font-normal text-fg-faint transition-colors hover:bg-highlight hover:text-fg-dim"
        onClick={() => setOpen(!open)}
      >
        {conn ? (
          connGlyph(conn, { size: 12, className: 'shrink-0', style: { color: connColor(conn) } })
        ) : (
          <LaptopIcon size={12} className="shrink-0" />
        )}
        {/* Wave shows icon-only for the local target; name only for remotes.
            The remote name is tinted with the connection's icon color. */}
        {conn && (
          <span className="truncate" style={{ color: connColor(conn) }}>
            {name}
          </span>
        )}
      </button>
      {open && (
        <ConnectionDropdown
          anchorRef={btnRef}
          current={target}
          onSelect={(t) => {
            setOpen(false);
            switchBlockTarget(leafId, t);
          }}
          onNew={() => {
            setOpen(false);
            openConnections('new');
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
