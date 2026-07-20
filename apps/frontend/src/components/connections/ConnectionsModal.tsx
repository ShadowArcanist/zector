import { useEffect, useState, type DragEvent, type ReactNode } from 'react';
import { getLocalMachineInfo } from '../../api/localInfo';
import type { LocalMachineInfo } from '../../api/types';
import { useConnectionsStore } from '../../store/connections';
import { useLayoutStore } from '../../store/layout';
import { useUiStore } from '../../store/ui';
import { CloseIcon, PlusIcon } from '../ui/icons/general';
import { LaptopIcon } from '../ui/icons/terminal';
import { IconButton } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { SettingsDivider, SettingsRow, SettingsTitle } from '../ui/Settings';
import { connColor } from './colors';
import { connGlyph, localGlyph } from './icons';
import { ColorSelect } from './ColorSelect';
import { IconSelect } from './IconSelect';
import { ConnectionForm } from './ConnectionForm';
import { CONNECTION_FIELD_CLASS } from './formStyles';
import { insertLocalConnection, moveConnectionId } from './reorder';

/** Neutral tint shown for the local icon when no color is picked. */
const LOCAL_AUTO_COLOR = '#b4b4b8';

function SidebarItem({
  icon,
  label,
  active,
  onClick,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragOver?: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
}) {
  return (
    <button
      type="button"
      draggable={draggable}
      className={`flex h-10 w-full shrink-0 items-center gap-2.5 rounded-xl px-3 text-left text-[13px] transition-colors ${
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      } ${
        active
          ? 'bg-white/10 font-medium text-fg shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
          : 'text-fg-dim hover:bg-white/5 hover:text-fg'
      }`}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <span className="flex w-4 shrink-0 justify-center">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

/** Content pane for the pinned local machine: every row saves immediately. */
function LocalPane() {
  const localName = useLayoutStore((s) => s.localName) ?? 'Localhost';
  const setLocalName = useLayoutStore((s) => s.setLocalName);
  const localIconKey = useLayoutStore((s) => s.localIcon) ?? null;
  const setLocalIcon = useLayoutStore((s) => s.setLocalIcon);
  const localColor = useLayoutStore((s) => s.localColor) ?? null;
  const setLocalColor = useLayoutStore((s) => s.setLocalColor);
  const [draft, setDraft] = useState(localName);
  const [info, setInfo] = useState<LocalMachineInfo | null>(null);

  useEffect(() => {
    let active = true;
    getLocalMachineInfo()
      .then((next) => {
        if (active) setInfo(next);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const commit = () => {
    setLocalName(draft);
    if (!draft.trim()) setDraft('Localhost');
  };

  return (
    <>
      <SettingsRow label="Name" htmlFor="local-name">
        <input
          id="local-name"
          value={draft}
          placeholder="Localhost"
          className={CONNECTION_FIELD_CLASS}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') {
              event.stopPropagation();
              setDraft(localName);
            }
          }}
        />
      </SettingsRow>
      <SettingsDivider />
      <SettingsRow label="Host" htmlFor="local-host">
        <input
          id="local-host"
          value={info?.ip ?? ''}
          placeholder="Detecting local IP…"
          className={`${CONNECTION_FIELD_CLASS} cursor-default text-fg-dim`}
          readOnly
        />
      </SettingsRow>
      <SettingsDivider />
      <SettingsRow label="Username" htmlFor="local-username">
        <input
          id="local-username"
          value={info?.username ?? ''}
          placeholder="Detecting username…"
          className={`${CONNECTION_FIELD_CLASS} cursor-default text-fg-dim`}
          readOnly
        />
      </SettingsRow>
      <SettingsDivider />
      <SettingsRow label="Icon">
        <IconSelect value={localIconKey} defaultIcon={LaptopIcon} onChange={setLocalIcon} />
      </SettingsRow>
      <SettingsDivider />
      <SettingsRow label="Icon color">
        <ColorSelect value={localColor} autoColor={LOCAL_AUTO_COLOR} onChange={setLocalColor} />
      </SettingsRow>
    </>
  );
}

/** Settings-style connections dialog: sidebar of targets + editable pane. */
export function ConnectionsModal() {
  const connections = useConnectionsStore((s) => s.connections);
  const reordering = useConnectionsStore((s) => s.reordering);
  const reorderConnections = useConnectionsStore((s) => s.reorder);
  const localName = useLayoutStore((s) => s.localName) ?? 'Localhost';
  const localIconKey = useLayoutStore((s) => s.localIcon);
  const localColor = useLayoutStore((s) => s.localColor);
  const localConnectionIndex = useLayoutStore((s) => s.localConnectionIndex);
  const setLocalConnectionIndex = useLayoutStore((s) => s.setLocalConnectionIndex);
  const view = useUiStore((s) => s.connectionsView); // null = local, 'new', or conn id
  const openConnections = useUiStore((s) => s.openConnections);
  const closeConnections = useUiStore((s) => s.closeConnections);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; after: boolean } | null>(null);
  const orderedIds = insertLocalConnection(
    connections.map((connection) => connection.id),
    localConnectionIndex,
  );

  const clearDrag = () => {
    setDraggedId(null);
    setDropTarget(null);
  };

  const dropConnection = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!draggedId || !dropTarget) return clearDrag();
    const current = orderedIds;
    const next = moveConnectionId(current, draggedId, dropTarget.id, dropTarget.after);
    clearDrag();
    if (next === current) return;

    setLocalConnectionIndex(next.indexOf('local'));
    const nextConnections = next.filter((id) => id !== 'local');
    if (nextConnections.some((id, index) => id !== connections[index]?.id)) {
      void reorderConnections(nextConnections);
    }
  };

  const dragProps = (id: string) => ({
    draggable: !reordering,
    onDragStart: (event: DragEvent<HTMLButtonElement>) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', id);
      setDraggedId(id);
    },
    onDragOver: (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const bounds = event.currentTarget.getBoundingClientRect();
      setDropTarget({
        id,
        after: event.clientY >= bounds.top + bounds.height / 2,
      });
    },
    onDrop: dropConnection,
    onDragEnd: clearDrag,
  });

  const editing =
    view && view !== 'new' ? (connections.find((c) => c.id === view) ?? null) : null;
  const pane: 'local' | 'new' | 'edit' = view === 'new' ? 'new' : editing ? 'edit' : 'local';
  const title = pane === 'local' ? localName : pane === 'new' ? 'New connection' : editing!.name;

  return (
    <Modal onClose={closeConnections} width="w-[640px]">
      <div className="flex h-[540px] max-h-full min-h-0">
        <aside className="flex w-[200px] shrink-0 flex-col gap-1 overflow-y-auto bg-black/20 p-3">
          {orderedIds.map((id) => {
            const connection = connections.find((candidate) => candidate.id === id);
            return (
              <div key={id} className="relative">
                {dropTarget?.id === id && draggedId !== id && (
                  <span
                    className={`pointer-events-none absolute inset-x-2 z-10 h-0.5 rounded-full bg-accent ${
                      dropTarget.after ? '-bottom-[3px]' : '-top-[3px]'
                    }`}
                  />
                )}
                <SidebarItem
                  icon={
                    connection
                      ? connGlyph(connection, {
                          size: 14,
                          style: { color: connColor(connection) },
                        })
                      : localGlyph(localIconKey, {
                          size: 15,
                          style: localColor ? { color: localColor } : undefined,
                        })
                  }
                  label={connection?.name ?? localName}
                  active={connection ? pane === 'edit' && editing?.id === id : pane === 'local'}
                  onClick={() => openConnections(connection?.id ?? null)}
                  {...dragProps(id)}
                />
              </div>
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
