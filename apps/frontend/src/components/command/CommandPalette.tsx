import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Block } from '../../api/types';
import { useConnectionsStore } from '../../store/connections';
import { useLayoutStore } from '../../store/layout';
import { useUiStore } from '../../store/ui';
import { connColor } from '../connections/colors';
import { connGlyph, localGlyph } from '../connections/icons';
import { Modal } from '../ui/Modal';
import { PlusIcon, SearchIcon } from '../ui/icons/general';
import { FolderIcon } from '../ui/icons/files';
import { ServerIcon, TerminalIcon } from '../ui/icons/terminal';
import { filterCommands, nextCommandIndex, type SearchableCommand } from './commandPaletteModel';

type Command = SearchableCommand & {
  group: string;
  icon: ReactNode;
  run: () => void;
};

const terminalBlock = (target: string): Block => ({
  kind: 'terminal',
  target,
  termId: crypto.randomUUID(),
});

const filesBlock = (target: string): Block => ({ kind: 'files', target, path: '' });

export function CommandPalette() {
  const close = useUiStore((state) => state.closeCommandPalette);
  const openConnections = useUiStore((state) => state.openConnections);
  const tabs = useLayoutStore((state) => state.tabs);
  const localName = useLayoutStore((state) => state.localName) ?? 'Localhost';
  const localIcon = useLayoutStore((state) => state.localIcon);
  const localColor = useLayoutStore((state) => state.localColor);
  const addTab = useLayoutStore((state) => state.addTab);
  const addTabWithBlock = useLayoutStore((state) => state.addTabWithBlock);
  const setActiveTab = useLayoutStore((state) => state.setActiveTab);
  const connections = useConnectionsStore((state) => state.connections);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const localGlyphNode = localGlyph(localIcon, {
      size: 14,
      style: localColor ? { color: localColor } : undefined,
    });
    return [
      {
        id: 'new-tab',
        label: 'New tab',
        keywords: 'create workspace',
        group: 'Application',
        icon: <PlusIcon size={14} />,
        run: addTab,
      },
      {
        id: 'connections',
        label: 'Open connections',
        keywords: 'ssh servers settings',
        group: 'Application',
        icon: <ServerIcon size={14} />,
        run: () => openConnections(),
      },
      {
        id: 'new-connection',
        label: 'Add SSH connection',
        keywords: 'new remote server',
        group: 'Application',
        icon: <PlusIcon size={14} />,
        run: () => openConnections('new'),
      },
      {
        id: 'local-terminal',
        label: `New terminal · ${localName}`,
        keywords: 'local shell machine',
        group: 'Create',
        icon: localGlyphNode,
        run: () => addTabWithBlock(terminalBlock('local')),
      },
      {
        id: 'local-files',
        label: `New files · ${localName}`,
        keywords: 'local browser explorer machine',
        group: 'Create',
        icon: <FolderIcon size={14} style={localColor ? { color: localColor } : undefined} />,
        run: () => addTabWithBlock(filesBlock('local')),
      },
      ...connections.flatMap<Command>((connection) => [
        {
          id: `terminal-${connection.id}`,
          label: `New terminal · ${connection.name}`,
          keywords: `ssh shell ${connection.host}`,
          group: 'Create',
          icon: connGlyph(connection, { size: 14, style: { color: connColor(connection) } }),
          run: () => addTabWithBlock(terminalBlock(connection.id)),
        },
        {
          id: `files-${connection.id}`,
          label: `New files · ${connection.name}`,
          keywords: `ssh browser explorer ${connection.host}`,
          group: 'Create',
          icon: <FolderIcon size={14} style={{ color: connColor(connection) }} />,
          run: () => addTabWithBlock(filesBlock(connection.id)),
        },
      ]),
      ...tabs.map<Command>((tab) => ({
        id: `tab-${tab.id}`,
        label: `Switch to ${tab.name}`,
        keywords: 'tab workspace go open',
        group: 'Tabs',
        icon: <TerminalIcon size={14} />,
        run: () => setActiveTab(tab.id),
      })),
    ];
  }, [addTab, addTabWithBlock, connections, localColor, localIcon, localName, openConnections, setActiveTab, tabs]);

  const filtered = useMemo(() => filterCommands(commands, query), [commands, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const execute = (command: Command | undefined) => {
    if (!command) return;
    close();
    command.run();
  };

  return (
    <Modal onClose={close} width="w-[520px]" surface="bg-menu">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/6 px-4">
        <SearchIcon size={15} className="shrink-0 text-fg-faint" />
        <input
          ref={inputRef}
          value={query}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-faint"
          placeholder="Type a command…"
          aria-label="Search commands"
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setSelected((current) =>
                nextCommandIndex(current, event.key === 'ArrowDown' ? 1 : -1, filtered.length),
              );
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              execute(filtered[selected]);
            }
          }}
        />
        <kbd className="rounded-md border border-white/8 bg-white/5 px-1.5 py-0.5 text-[10px] text-fg-faint">
          esc
        </kbd>
      </div>
      <div className="max-h-[360px] min-h-[80px] overflow-y-auto p-2">
        {filtered.length ? (
          filtered.map((command, index) => (
            <button
              key={command.id}
              type="button"
              className={`flex h-9 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left transition-colors ${
                selected === index ? 'bg-white/10 text-fg' : 'text-fg-dim hover:bg-white/6 hover:text-fg'
              }`}
              onMouseEnter={() => setSelected(index)}
              onClick={() => execute(command)}
            >
              <span className="flex w-4 shrink-0 justify-center text-fg-faint">{command.icon}</span>
              <span className="min-w-0 flex-1 truncate text-[13px]">{command.label}</span>
              <span className="shrink-0 text-[10px] text-fg-faint">{command.group}</span>
            </button>
          ))
        ) : (
          <div className="flex h-16 items-center justify-center text-[12px] text-fg-faint">
            No matching commands
          </div>
        )}
      </div>
      <div className="flex h-8 shrink-0 items-center gap-3 border-t border-white/6 px-4 text-[10px] text-fg-faint">
        <span>↑↓ navigate</span>
        <span>↵ run</span>
      </div>
    </Modal>
  );
}
