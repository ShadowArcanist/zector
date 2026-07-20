import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Block } from '../../api/types';
import { useConnectionsStore } from '../../store/connections';
import { useLayoutStore } from '../../store/layout';
import { firstLeafId } from '../../store/tree';
import { useUiStore } from '../../store/ui';
import { connColor } from '../connections/colors';
import { connGlyph, localGlyph } from '../connections/icons';
import { Modal } from '../ui/Modal';
import { ChevronLeftIcon, PlusIcon, SearchIcon } from '../ui/icons/general';
import { FolderIcon } from '../ui/icons/files';
import { ServerIcon, TerminalIcon } from '../ui/icons/terminal';
import { filterCommands, nextCommandIndex, type SearchableCommand } from './commandPaletteModel';

type BlockKind = 'terminal' | 'files';

type Command = SearchableCommand & {
  group: string;
  icon: ReactNode;
  closeOnRun?: boolean;
  run: () => void;
};

type TargetChoice = SearchableCommand & {
  group: string;
  icon: ReactNode;
  target: string;
};

const makeBlock = (kind: BlockKind, target: string): Block =>
  kind === 'terminal'
    ? { kind, target, termId: crypto.randomUUID() }
    : { kind, target, path: '' };

export function CommandPalette() {
  const close = useUiStore((state) => state.closeCommandPalette);
  const openConnections = useUiStore((state) => state.openConnections);
  const tabs = useLayoutStore((state) => state.tabs);
  const activeTabId = useLayoutStore((state) => state.activeTabId);
  const focusedLeafId = useLayoutStore((state) => state.focusedLeafId);
  const localName = useLayoutStore((state) => state.localName) ?? 'Localhost';
  const localIcon = useLayoutStore((state) => state.localIcon);
  const localColor = useLayoutStore((state) => state.localColor);
  const addTab = useLayoutStore((state) => state.addTab);
  const addTabWithBlock = useLayoutStore((state) => state.addTabWithBlock);
  const setTabRoot = useLayoutStore((state) => state.setTabRoot);
  const splitLeaf = useLayoutStore((state) => state.splitLeaf);
  const setActiveTab = useLayoutStore((state) => state.setActiveTab);
  const connections = useConnectionsStore((state) => state.connections);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [targetKind, setTargetKind] = useState<BlockKind | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(
    () => [
      {
        id: 'new-tab',
        label: 'New tab',
        keywords: 'create workspace',
        group: 'Application',
        icon: <PlusIcon size={14} />,
        run: addTab,
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
        id: 'connections',
        label: 'Open connections',
        keywords: 'ssh servers settings',
        group: 'Application',
        icon: <ServerIcon size={14} />,
        run: () => openConnections(),
      },
      {
        id: 'add-terminal',
        label: 'Add terminal block',
        keywords: 'new shell connection',
        group: 'Create',
        icon: <TerminalIcon size={14} />,
        closeOnRun: false,
        run: () => setTargetKind('terminal'),
      },
      {
        id: 'add-files',
        label: 'Add files block',
        keywords: 'new browser explorer connection',
        group: 'Create',
        icon: <FolderIcon size={14} />,
        closeOnRun: false,
        run: () => setTargetKind('files'),
      },
      ...tabs.map<Command>((tab) => ({
        id: `tab-${tab.id}`,
        label: `Switch to ${tab.name}`,
        keywords: 'tab workspace go open',
        group: 'Tabs',
        icon: <TerminalIcon size={14} />,
        run: () => setActiveTab(tab.id),
      })),
    ],
    [addTab, openConnections, setActiveTab, tabs],
  );

  const targets = useMemo<TargetChoice[]>(
    () => [
      {
        id: 'local',
        label: localName,
        keywords: 'local machine',
        group: 'Local',
        target: 'local',
        icon: localGlyph(localIcon, {
          size: 14,
          style: localColor ? { color: localColor } : undefined,
        }),
      },
      ...connections.map<TargetChoice>((connection) => ({
        id: connection.id,
        label: connection.name,
        keywords: `ssh ${connection.host}`,
        group: 'Connection',
        target: connection.id,
        icon: connGlyph(connection, { size: 14, style: { color: connColor(connection) } }),
      })),
    ],
    [connections, localColor, localIcon, localName],
  );

  const filteredCommands = useMemo(() => filterCommands(commands, query), [commands, query]);
  const filteredTargets = useMemo(() => filterCommands(targets, query), [query, targets]);
  const results = targetKind ? filteredTargets : filteredCommands;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const resetSearch = () => {
    setQuery('');
    setSelected(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const execute = (command: Command | undefined) => {
    if (!command) return;
    if (command.closeOnRun !== false) close();
    command.run();
    if (command.closeOnRun === false) resetSearch();
  };

  const addBlockRight = (block: Block) => {
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    if (!activeTab) {
      addTabWithBlock(block);
      return;
    }
    if (!activeTab.root) {
      setTabRoot(activeTab.id, block);
      return;
    }
    const leafId = focusedLeafId ?? firstLeafId(activeTab.root);
    if (leafId) splitLeaf(leafId, 'row', block);
  };

  const chooseTarget = (choice: TargetChoice | undefined) => {
    if (!choice || !targetKind) return;
    addBlockRight(makeBlock(targetKind, choice.target));
    close();
  };

  const goBack = () => {
    setTargetKind(null);
    resetSearch();
  };

  return (
    <Modal onClose={close} width="w-[520px]" surface="bg-menu">
      <div className="flex h-12 shrink-0 items-center gap-3 border-b border-white/6 px-4">
        {targetKind ? (
          <button
            type="button"
            aria-label="Back to commands"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-faint transition-colors hover:bg-white/8 hover:text-fg"
            onClick={goBack}
          >
            <ChevronLeftIcon size={14} />
          </button>
        ) : (
          <SearchIcon size={15} className="shrink-0 text-fg-faint" />
        )}
        <input
          ref={inputRef}
          value={query}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-fg-faint"
          placeholder={targetKind ? `Choose a connection for ${targetKind}…` : 'Type a command…'}
          aria-label={targetKind ? 'Choose a connection' : 'Search commands'}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelected(0);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setSelected((current) =>
                nextCommandIndex(current, event.key === 'ArrowDown' ? 1 : -1, results.length),
              );
            }
            if (event.key === 'Enter') {
              event.preventDefault();
              if (targetKind) chooseTarget(filteredTargets[selected]);
              else execute(filteredCommands[selected]);
            }
            if (event.key === 'Backspace' && targetKind && !query) {
              event.preventDefault();
              goBack();
            }
          }}
        />
        <kbd className="rounded-md border border-white/8 bg-white/5 px-1.5 py-0.5 text-[10px] text-fg-faint">
          esc
        </kbd>
      </div>
      <div className="max-h-[360px] min-h-[80px] overflow-y-auto p-2">
        {results.length ? (
          results.map((result, index) => (
            <button
              key={result.id}
              type="button"
              className={`flex h-9 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left transition-colors ${
                selected === index ? 'bg-white/10 text-fg' : 'text-fg-dim hover:bg-white/6 hover:text-fg'
              }`}
              onMouseEnter={() => setSelected(index)}
              onClick={() => {
                if (targetKind) chooseTarget(result as TargetChoice);
                else execute(result as Command);
              }}
            >
              <span className="flex w-4 shrink-0 justify-center text-fg-faint">{result.icon}</span>
              <span className="min-w-0 flex-1 truncate text-[13px]">{result.label}</span>
              <span className="shrink-0 text-[10px] text-fg-faint">{result.group}</span>
            </button>
          ))
        ) : (
          <div className="flex h-16 items-center justify-center text-[12px] text-fg-faint">
            No matching {targetKind ? 'connections' : 'commands'}
          </div>
        )}
      </div>
      <div className="flex h-8 shrink-0 items-center gap-3 border-t border-white/6 px-4 text-[10px] text-fg-faint">
        <span>↑↓ navigate</span>
        <span>↵ {targetKind ? 'select' : 'run'}</span>
        {targetKind && <span>⌫ back</span>}
      </div>
    </Modal>
  );
}
