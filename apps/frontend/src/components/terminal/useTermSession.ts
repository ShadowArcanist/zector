import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { termWsUrl } from '../../api/term';
import { zectorTermTheme, TERM_FONT } from './xtermTheme';

export type TermStatus =
  | { kind: 'connecting' }
  | { kind: 'open' }
  | { kind: 'reconnecting'; attempt: number }
  | { kind: 'disconnected' } // gave up reconnecting
  | { kind: 'exited' }
  | { kind: 'error'; message: string };

const BACKOFF_MS = [500, 1000, 2000, 4000, 5000];

/**
 * Owns one xterm instance + WebSocket for a termId/target pair.
 * The whole session is torn down and rebuilt when termId changes (restart).
 */
export function useTermSession(termId: string, target: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const retryRef = useRef<() => void>(() => {});
  const [status, setStatus] = useState<TermStatus>({ kind: 'connecting' });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const term = new Terminal({
      allowProposedApi: true,
      cursorBlink: true,
      fontFamily: TERM_FONT,
      fontSize: 13,
      lineHeight: 1.15,
      scrollback: 5000,
      theme: zectorTermTheme,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(container);
    try {
      const webgl = new WebglAddon();
      webgl.onContextLoss(() => webgl.dispose());
      term.loadAddon(webgl);
    } catch {
      // WebGL unavailable — xterm 6 falls back to the DOM renderer
    }
    fit.fit();
    termRef.current = term;
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
    };
  }, [termId, target]);

  const focus = () => termRef.current?.focus();
  const retry = () => retryRef.current();
  return { containerRef, status, focus, retry };
}
