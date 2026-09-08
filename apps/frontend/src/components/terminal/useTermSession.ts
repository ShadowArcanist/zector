import { useEffect, useRef, useState } from 'react';
import type { ITheme } from '@xterm/xterm';
import { WebglAddon } from '@xterm/addon-webgl';
import {
  acquireTermSession,
  getTermSession,
  releaseTermSession,
  type TermStatus,
} from './termSessions';
import { themedTheme } from './themes';

export type { TermStatus };

// The WebGL renderer does not honor a transparent background, so opaque
// terminals use it while transparent ones (tab bg preset) fall back to the
// DOM renderer; a `transparent` flip recreates the session (acceptable flash
// only when toggling the tab background).

/**
 * Binds one registry-owned xterm session (see termSessions.ts) to a component.
 * On mount it adopts a live session for termId when one exists — re-parenting
 * the existing terminal element so moves/splits never clear or replay — and
 * otherwise creates one. On unmount the session is parked, not disposed.
 */
export function useTermSession(
  termId: string,
  target: string,
  theme: ITheme,
  fontSize: number,
  transparent = false,
  redactIPs: string[] = [],
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const optsRef = useRef({ theme, fontSize });
  const [status, setStatus] = useState<TermStatus>({ kind: 'connecting' });

  // Declared before the mount effect so a brand-new session reads current
  // options from optsRef; on later changes it restyles the live terminal.
  useEffect(() => {
    optsRef.current = { theme, fontSize };
    const session = getTermSession(termId);
    if (!session) return;
    session.term.options.theme = themedTheme(theme, session.transparent);
    session.term.options.fontSize = fontSize;
    session.fit.fit();
  }, [theme, fontSize, termId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const { theme: curTheme, fontSize: curFontSize } = optsRef.current;
    const session = acquireTermSession(termId, {
      target,
      transparent,
      theme: curTheme,
      fontSize: curFontSize,
      redactIPs,
    });

    if (session.term.element) {
      // adopt: xterm supports re-parenting its element after open()
      container.appendChild(session.term.element);
    } else {
      session.term.open(container);
      if (!transparent) {
        session.webglLoaded = true;
        try {
          const webgl = new WebglAddon();
          webgl.onContextLoss(() => webgl.dispose());
          session.term.loadAddon(webgl);
        } catch {
          // WebGL unavailable — xterm 6 falls back to the DOM renderer
        }
      }
    }
    session.term.options.theme = themedTheme(curTheme, transparent);
    session.term.options.fontSize = curFontSize;
    session.fit.fit();

    setStatus(session.status);
    const sub = (s: TermStatus) => setStatus(s);
    session.subscribers.add(sub);

    // the resize observer belongs to the component: it refits the adopted term
    let fitTimer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(fitTimer);
      fitTimer = setTimeout(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) session.fit.fit();
      }, 40);
    });
    observer.observe(container);

    return () => {
      clearTimeout(fitTimer);
      observer.disconnect();
      session.subscribers.delete(sub);
      if (session.term.element?.parentElement === container) session.term.element.remove();
      // no dispose: park the element and let the registry grace-collect it
      releaseTermSession(termId);
    };
  }, [termId, target, transparent, redactIPs]);

  const focus = () => getTermSession(termId)?.term.focus();
  const retry = () => getTermSession(termId)?.retry();
  const getTerm = () => getTermSession(termId)?.term ?? null;
  return { containerRef, status, focus, retry, getTerm };
}
