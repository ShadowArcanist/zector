import { Terminal, type ITheme } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { onTermKill, termWsUrl } from '../../api/term';
import { TERM_FONT, TERM_FONT_WEIGHT, TERM_FONT_WEIGHT_BOLD, themedTheme } from './themes';

export type TermStatus =
  | { kind: 'connecting' | 'open' | 'exited' }
  | { kind: 'reconnecting'; attempt: number }
  | { kind: 'disconnected' } // gave up reconnecting
  | { kind: 'error'; message: string };

export type TermSession = {
  termId: string;
  target: string;
  transparent: boolean;
  term: Terminal;
  fit: FitAddon;
  status: TermStatus;
  subscribers: Set<(status: TermStatus) => void>;
  webglLoaded: boolean; // the WebGL addon is loaded once, after the first open()
  disposeTimer: ReturnType<typeof setTimeout> | undefined;
  retry: () => void;
  dispose: () => void;
};

const BACKOFF_MS = [500, 1000, 2000, 4000, 5000];
const DISPOSE_DELAY_MS = 5000;

// Module-level registry of live xterm+WebSocket sessions keyed by termId.
// Sessions outlive React mounts: when block moves/splits re-nest the panel
// tree and remount the terminal component, the new mount ADOPTS the existing
// session (re-parenting `term.element`), so nothing clears or replays. Real
// teardown: kill/restart, a transparent (renderer) change, or ~5s unmounted.
const sessions = new Map<string, TermSession>();

export type TermInit = { target: string; transparent: boolean; theme: ITheme; fontSize: number };

function createSession(termId: string, init: TermInit): TermSession {
  const { target, transparent, theme, fontSize } = init;
  const term = new Terminal({
    allowProposedApi: true,
    allowTransparency: transparent,
    cursorBlink: true,
    fontFamily: TERM_FONT,
    fontSize,
    fontWeight: TERM_FONT_WEIGHT,
    fontWeightBold: TERM_FONT_WEIGHT_BOLD,
    lineHeight: 1.15,
    scrollback: 5000,
    theme: themedTheme(theme, transparent),
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  term.loadAddon(new WebLinksAddon());

  let ws: WebSocket | null = null;
  let disposed = false;
  let everOpened = false;
  let done = false; // session ended via exit/error control frame
  let attempts = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  const encoder = new TextEncoder();

  const session: TermSession = {
    termId,
    target,
    transparent,
    term,
    fit,
    status: { kind: 'connecting' },
    subscribers: new Set(),
    webglLoaded: false,
    disposeTimer: undefined,
    retry: () => {
      if (disposed || done) return;
      attempts = 0;
      setStatus({ kind: 'connecting' });
      connect();
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      clearTimeout(reconnectTimer);
      clearTimeout(session.disposeTimer);
      sessions.delete(termId);
      const socket = ws;
      ws = null;
      socket?.close();
      term.dispose();
    },
  };

  const setStatus = (status: TermStatus) => {
    session.status = status;
    for (const sub of session.subscribers) sub(status);
  };

  const sendResize = () => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    }
  };

  // All handlers write to the one `term` captured here — a session never swaps
  // its Terminal instance, so there is no stale-closure hazard on remounts.
  const connect = () => {
    if (disposed) return;
    const socket = new WebSocket(termWsUrl(termId, target));
    socket.binaryType = 'arraybuffer';
    ws = socket;

    socket.onopen = () => {
      if (disposed) return;
      attempts = 0;
      // server replays scrollback on reattach; clear stale content first
      if (everOpened) term.reset();
      everOpened = true;
      setStatus({ kind: 'open' });
      sendResize();
    };
    socket.onmessage = (ev) => {
      if (disposed) return;
      if (ev.data instanceof ArrayBuffer) {
        term.write(new Uint8Array(ev.data));
        return;
      }
      try {
        const msg = JSON.parse(ev.data as string) as { type: string; message?: string };
        if (msg.type === 'exit') {
          done = true;
          setStatus({ kind: 'exited' });
        } else if (msg.type === 'error') {
          done = true;
          setStatus({ kind: 'error', message: msg.message ?? 'terminal error' });
        }
      } catch {
        // ignore malformed control frames
      }
    };
    socket.onclose = () => {
      if (disposed || done || ws !== socket) return;
      if (attempts >= BACKOFF_MS.length) {
        setStatus({ kind: 'disconnected' });
        return;
      }
      const delay = BACKOFF_MS[attempts];
      attempts += 1;
      setStatus({ kind: 'reconnecting', attempt: attempts });
      reconnectTimer = setTimeout(connect, delay);
    };
  };
  connect();

  term.onData((data) => {
    if (ws?.readyState === WebSocket.OPEN) ws.send(encoder.encode(data));
  });
  term.onResize(sendResize);

  return session;
}

// Get the live session for termId, or create one. A pending disposal timer is
// cancelled (remount within the grace window adopts); a target/transparent
// mismatch tears the old session down and starts fresh.
export function acquireTermSession(termId: string, init: TermInit): TermSession {
  let session = sessions.get(termId);
  if (session && (session.target !== init.target || session.transparent !== init.transparent)) {
    session.dispose();
    session = undefined;
  }
  if (!session) {
    session = createSession(termId, init);
    sessions.set(termId, session);
  }
  clearTimeout(session.disposeTimer);
  session.disposeTimer = undefined;
  return session;
}

/** Component unmounted: keep the session parked, dispose after a grace period. */
export function releaseTermSession(termId: string) {
  const session = sessions.get(termId);
  if (!session) return;
  clearTimeout(session.disposeTimer);
  session.disposeTimer = setTimeout(() => session.dispose(), DISPOSE_DELAY_MS);
}

export function getTermSession(termId: string): TermSession | null {
  return sessions.get(termId) ?? null;
}

// Backend kill (close block/tab, restart, target switch) → immediate teardown.
onTermKill((termId) => sessions.get(termId)?.dispose());
