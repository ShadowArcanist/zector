import { useEffect, useRef, useState } from 'react';
import { Terminal, type ITheme } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { termWsUrl } from '../../api/term';
import { TERM_FONT, TERM_FONT_WEIGHT, TERM_FONT_WEIGHT_BOLD } from './themes';

export type TermStatus =
  | { kind: 'connecting' }
  | { kind: 'open' }
  | { kind: 'reconnecting'; attempt: number }
  | { kind: 'disconnected' } // gave up reconnecting
  | { kind: 'exited' }
  | { kind: 'error'; message: string };

const BACKOFF_MS = [500, 1000, 2000, 4000, 5000];

// The WebGL renderer does not honor a transparent background, so opaque
// terminals use it while transparent ones (tab bg preset) fall back to the
// DOM renderer; the renderer swap recreates the xterm instance (session and
// scrollback survive via the server-side replay on reattach).

/**
 * Owns one xterm instance + WebSocket for a termId/target pair.
 * The whole session is torn down and rebuilt when termId changes (restart)
 * or `transparent` flips; theme and fontSize are applied in place.
 */
export function useTermSession(
  termId: string,
  target: string,
  theme: ITheme,
  fontSize: number,
  transparent = false,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const optsRef = useRef({ theme, fontSize });
  const retryRef = useRef<() => void>(() => {});
  const [status, setStatus] = useState<TermStatus>({ kind: 'connecting' });

  const themed = (t: ITheme): ITheme => (transparent ? { ...t, background: '#00000000' } : t);

  // Declared before the session effect so a brand-new session reads current
  // options from optsRef; on later changes it restyles the live terminal.
  useEffect(() => {
    optsRef.current = { theme, fontSize };
    const term = termRef.current;
    if (!term) return;
    term.options.theme = themed(theme);
    term.options.fontSize = fontSize;
    fitRef.current?.fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `transparent` recreates the session below
  }, [theme, fontSize]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      allowProposedApi: true,
      allowTransparency: transparent,
      cursorBlink: true,
      fontFamily: TERM_FONT,
      fontSize: optsRef.current.fontSize,
      fontWeight: TERM_FONT_WEIGHT,
      fontWeightBold: TERM_FONT_WEIGHT_BOLD,
      lineHeight: 1.15,
      scrollback: 5000,
      theme: themed(optsRef.current.theme),
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(container);
    if (!transparent) {
      try {
        const webgl = new WebglAddon();
        webgl.onContextLoss(() => webgl.dispose());
        term.loadAddon(webgl);
      } catch {
        // WebGL unavailable — xterm 6 falls back to the DOM renderer
      }
    }
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;
    setStatus({ kind: 'connecting' });

    let ws: WebSocket | null = null;
    let disposed = false;
    let everOpened = false;
    let done = false; // session ended via exit/error control frame
    let attempts = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    const encoder = new TextEncoder();

    const sendResize = () => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
      }
    };

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
    retryRef.current = () => {
      if (disposed || done) return;
      attempts = 0;
      setStatus({ kind: 'connecting' });
      connect();
    };

    const dataSub = term.onData((data) => {
      if (ws?.readyState === WebSocket.OPEN) ws.send(encoder.encode(data));
    });
    const resizeSub = term.onResize(sendResize);

    let fitTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(() => {
        if (!disposed && container.clientWidth > 0 && container.clientHeight > 0) fit.fit();
      }, 40);
    });
    observer.observe(container);

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      clearTimeout(fitTimer);
      observer.disconnect();
      dataSub.dispose();
      resizeSub.dispose();
      const socket = ws;
      ws = null;
      socket?.close();
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- themed() reads only `transparent`, already a dep
  }, [termId, target, transparent]);

  const focus = () => termRef.current?.focus();
  const retry = () => retryRef.current();
  const getTerm = () => termRef.current;
  return { containerRef, status, focus, retry, getTerm };
}
