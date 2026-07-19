import { Check, CircleAlert, Pencil, Plus, Server, Trash2 } from 'lucide-react';
import type { Connection } from '../../api/types';
import { useConnectionsStore } from '../../store/connections';
import { pushToast } from '../../store/toast';
import { useUiStore } from '../../store/ui';
import { Button, IconButton } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { ConnectionForm } from './ConnectionForm';

function ConnectionRow({ conn }: { conn: Connection }) {
  const test = useConnectionsStore((s) => s.test);
  const remove = useConnectionsStore((s) => s.remove);
  const testState = useConnectionsStore((s) => s.testStates[conn.id]);
  const openConnections = useUiStore((s) => s.openConnections);

  const onDelete = () => {
    if (!window.confirm(`Delete connection "${conn.name}"?`)) return;
    remove(conn.id).catch((err) =>
      pushToast('error', err instanceof Error ? err.message : 'Delete failed'),
    );
  };

  return (
    <div className="group flex items-center gap-2 rounded-md px-2.5 py-2 transition-colors hover:bg-hover">
      <Server size={14} className="shrink-0 text-fg-faint" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] text-fg">{conn.name}</div>
        <div className="truncate font-mono text-[11px] text-fg-faint">
          {conn.username}@{conn.host}:{conn.port}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {testState?.state === 'testing' && <Spinner size={12} />}
        {testState?.state === 'ok' && (
          <span className="flex items-center gap-1 text-[11px] text-ok">
            <Check size={12} /> ok
          </span>
        )}
        {testState?.state === 'error' && (
          <span
            className="flex max-w-40 items-center gap-1 truncate text-[11px] text-danger"
            title={testState.message}
          >
            <CircleAlert size={12} className="shrink-0" /> {testState.message}
          </span>
        )}
        <Button size="sm" variant="subtle" onClick={() => void test(conn.id)} disabled={testState?.state === 'testing'}>
          Test
        </Button>
        <IconButton title="Edit" aria-label="Edit" onClick={() => openConnections(conn.id)}>
          <Pencil size={13} />
        </IconButton>
        <IconButton title="Delete" aria-label="Delete" danger onClick={onDelete}>
          <Trash2 size={13} />
        </IconButton>
      </div>
    </div>
  );
}

export function ConnectionsModal() {
  const connections = useConnectionsStore((s) => s.connections);
  const view = useUiStore((s) => s.connectionsView);
  const openConnections = useUiStore((s) => s.openConnections);
  const closeConnections = useUiStore((s) => s.closeConnections);

  const editing = view && view !== 'new' ? (connections.find((c) => c.id === view) ?? null) : null;
  const formOpen = view === 'new' || editing !== null;

  return (
    <Modal
      title={formOpen ? (editing ? 'Edit connection' : 'New SSH connection') : 'Connections'}
      onClose={closeConnections}
      width="w-[460px]"
    >
      {formOpen ? (
        <ConnectionForm existing={editing} onDone={() => openConnections(null)} />
      ) : (
        <div className="p-2">
          {connections.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12px] text-fg-faint">
              No saved connections yet.
            </p>
          ) : (
            connections.map((c) => <ConnectionRow key={c.id} conn={c} />)
          )}
          <div className="mt-1 border-t border-white/8 px-1 pt-2 pb-1">
            <Button variant="ghost" onClick={() => openConnections('new')}>
              <Plus size={13} />
              New SSH connection
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
