import { create } from 'zustand';
import type { Connection, ConnectionInput } from '../api/types';
import * as api from '../api/connections';
import { pushToast } from './toast';

export type TestState = { state: 'testing' } | { state: 'ok' } | { state: 'error'; message: string };

type ConnectionsStore = {
  connections: Connection[];
  loaded: boolean;
  testStates: Record<string, TestState | undefined>;
  load: () => Promise<void>;
  save: (input: ConnectionInput, id?: string) => Promise<Connection>;
  remove: (id: string) => Promise<void>;
  test: (id: string) => Promise<void>;
};

export const useConnectionsStore = create<ConnectionsStore>((set) => ({
  connections: [],
  loaded: false,
  testStates: {},

  load: async () => {
    try {
      const connections = await api.listConnections();
      set({ connections, loaded: true });
    } catch {
      set({ loaded: true });
      pushToast('error', 'Could not load connections — backend unreachable');
    }
  },

  save: async (input, id) => {
    const saved = id ? await api.updateConnection(id, input) : await api.createConnection(input);
    set((s) => ({
      connections: id
        ? s.connections.map((c) => (c.id === id ? saved : c))
        : [...s.connections, saved],
    }));
    return saved;
  },

  remove: async (id) => {
    await api.deleteConnection(id);
    set((s) => ({ connections: s.connections.filter((c) => c.id !== id) }));
  },

  test: async (id) => {
    set((s) => ({ testStates: { ...s.testStates, [id]: { state: 'testing' } } }));
    let next: TestState;
    try {
      const result = await api.testConnection(id);
      next = result.ok ? { state: 'ok' } : { state: 'error', message: result.error };
    } catch (err) {
      next = { state: 'error', message: err instanceof Error ? err.message : 'test failed' };
    }
    set((s) => ({ testStates: { ...s.testStates, [id]: next } }));
  },
}));

/** Display name of a target for block titles: 'local' or the connection name. */
export function targetName(target: string, connections: Connection[]): string {
  if (target === 'local') return 'local';
  return connections.find((c) => c.id === target)?.name ?? 'unknown host';
}
