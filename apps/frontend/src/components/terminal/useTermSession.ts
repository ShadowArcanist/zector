import { useEffect, useRef, useState } from 'react';
import type { ITheme } from '@xterm/xterm';
import {
  acquireTermSession,
  getTermSession,
  releaseTermSession,
  type TermStatus,
} from './termSessions';
import { themedTheme } from './themes';

export type { TermStatus };

// Terminals use xterm's built-in DOM renderer. The WebGL renderer was dropped:
// its only stable release (@xterm/addon-webgl 0.19.0) corrupts its glyph
// texture atlas during the rapid full-screen redraws that programs like
// `docker stats`/`top` emit, so cleared cells keep old glyphs and the screen
// appears to duplicate. The DOM renderer is fast enough for an interactive
// terminal and also honors transparent backgrounds.

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
