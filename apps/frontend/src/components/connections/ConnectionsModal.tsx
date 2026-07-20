import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useConnectionsStore } from '../../store/connections';
import { useLayoutStore } from '../../store/layout';
import { useUiStore } from '../../store/ui';
import { CloseIcon, EditIcon, PlusIcon } from '../ui/icons/general';
import { LaptopIcon } from '../ui/icons/terminal';
import { IconButton } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SettingsDivider, SettingsRow, SettingsTitle } from '../ui/Settings';
import { connColor } from './colors';
import { connIcon } from './icons';
import { ConnectionForm } from './ConnectionForm';

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex h-10 w-full shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-left text-[13px] transition-colors ${
        active
          ? 'bg-white/10 font-medium text-fg shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
          : 'text-fg-dim hover:bg-white/5 hover:text-fg'
      }`}
      onClick={onClick}
    >
      <span className="flex w-4 shrink-0 justify-center">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

/** Content pane for the pinned local machine: rename stays inline. */
function LocalPane() {
  const localName = useLayoutStore((s) => s.localName) ?? 'Localhost';
  const setLocalName = useLayoutStore((s) => s.setLocalName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(localName);
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    setLocalName(draft);
  };

  return (
    <>
      <SettingsRow label="Name" htmlFor="local-name">
        {editing ? (
          <input
            id="local-name"
            ref={inputRef}
            value={draft}
            placeholder="Localhost"
            className="h-8 w-[200px] rounded-lg bg-white/5 px-3 text-right text-[13px] text-fg outline-none placeholder:text-fg-faint focus:ring-1 focus:ring-accent"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                e.stopPropagation();
                setEditing(false);
              }
            }}
          />
        ) : (
          <>
            <span className="text-[13px] text-fg-dim" onDoubleClick={startEdit}>
              {localName}
            </span>
            <IconButton title="Rename" aria-label="Rename local machine" onClick={startEdit}>
              <EditIcon size={13} />
            </IconButton>
          </>
        )}
      </SettingsRow>
      <SettingsDivider />
      <SettingsRow label="Target">
        <span className="text-[13px] text-fg-faint">This machine</span>
      </SettingsRow>
    </>
  );
}

/** Settings-style connections dialog: sidebar of targets + editable pane. */
export function ConnectionsModal() {
  const connections = useConnectionsStore((s) => s.connections);
  const localName = useLayoutStore((s) => s.localName) ?? 'Localhost';
  const view = useUiStore((s) => s.connectionsView); // null = local, 'new', or conn id
  const openConnections = useUiStore((s) => s.openConnections);
  const closeConnections = useUiStore((s) => s.closeConnections);

  const editing =
    view && view !== 'new' ? (connections.find((c) => c.id === view) ?? null) : null;
  const pane: 'local' | 'new' | 'edit' = view === 'new' ? 'new' : editing ? 'edit' : 'local';
  const title = pane === 'local' ? localName : pane === 'new' ? 'New connection' : editing!.name;

  return (
    <Modal onClose={closeConnections} width="w-[640px]">
      <div className="flex h-[540px] max-h-full min-h-0">
        <aside className="flex w-[200px] shrink-0 flex-col gap-1 overflow-y-auto bg-black/20 p-3">
          <SidebarItem
            icon={<LaptopIcon size={15} />}
            label={localName}
            active={pane === 'local'}
            onClick={() => openConnections(null)}
          />
          {connections.map((c) => {
            const Icon = connIcon(c);
            return (
              <SidebarItem
                key={c.id}
                icon={<Icon size={14} style={{ color: connColor(c) }} />}
                label={c.name}
                active={pane === 'edit' && editing?.id === c.id}
                onClick={() => openConnections(c.id)}
              />
            );
          })}
          <div className="mt-auto pt-2">
            <SidebarItem
              icon={<PlusIcon size={15} />}
              label="Add connection"
              active={pane === 'new'}
              onClick={() => openConnections('new')}
            />
          </div>
        </aside>
        <section className="flex min-w-0 flex-1 flex-col bg-black/45">
          <SettingsTitle
            right={
              <IconButton onClick={closeConnections} aria-label="Close">
                <CloseIcon size={15} />
              </IconButton>
            }
          >
            {title}
          </SettingsTitle>
          <div className="h-px shrink-0 bg-white/4" />
          <div className="flex min-h-0 flex-1 flex-col">
            {pane === 'local' ? (
              <LocalPane />
            ) : (
              <ConnectionForm
                key={editing?.id ?? 'new'}
                existing={editing}
                onSaved={(id) => openConnections(id)}
                onDeleted={() => openConnections(null)}
              />
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
