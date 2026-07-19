import { CircleAlert, RotateCw } from 'lucide-react';
import type { TerminalBlockData } from '../../api/types';
import { killTerm } from '../../api/term';
import { useLayoutStore } from '../../store/layout';
import { openContextMenu } from '../../store/contextMenu';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useTermSession } from './useTermSession';
import { buildTermMenu } from './termMenu';
import { DEFAULT_TERM_FONT_SIZE, resolveTermTheme } from './themes';

export function TerminalBlock({ leafId, block }: { leafId: string; block: TerminalBlockData }) {
  const updateLeafBlock = useLayoutStore((s) => s.updateLeafBlock);
  const { theme } = resolveTermTheme(block.termTheme);
  const fontSize = block.fontSize ?? DEFAULT_TERM_FONT_SIZE;
  const { containerRef, status, focus, retry, getTerm } = useTermSession(
    block.termId,
    block.target,
    theme,
    fontSize,
  );

  const restart = () => {
    killTerm(block.termId).catch(() => {});
    updateLeafBlock(leafId, { ...block, termId: crypto.randomUUID() });
  };

  const showOverlay =
    status.kind === 'exited' || status.kind === 'error' || status.kind === 'disconnected';

  return (
    <div
      className="absolute inset-0"
      style={{ background: theme.background }}
      onMouseUp={() => focus()}
      onContextMenu={(e) =>
        openContextMenu(e, buildTermMenu({ leafId, block, term: getTerm(), restart }))
      }
    >
      {/* Wave-exact terminal viewport padding */}
      <div ref={containerRef} className="absolute inset-0 pt-[5px] pr-px pb-[5px] pl-1" />

      {status.kind === 'reconnecting' && (
        <div className="absolute inset-x-0 top-0 z-10 flex h-5 items-center justify-center gap-1.5 bg-warn/15 text-[11px] text-warn">
          <Spinner size={11} className="text-warn" />
          reconnecting… (attempt {status.attempt})
        </div>
      )}
      {status.kind === 'connecting' && (
        <div className="absolute inset-x-0 top-0 z-10 flex h-5 items-center justify-center gap-1.5 text-[11px] text-fg-faint">
          <Spinner size={11} />
          connecting…
        </div>
      )}

      {showOverlay && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-bg0/80 backdrop-blur-[2px]">
          {status.kind === 'error' ? (
            <div className="flex max-w-[80%] items-start gap-2 text-[13px] text-danger">
              <CircleAlert size={16} className="mt-0.5 shrink-0" />
              <span className="break-words">{status.message}</span>
            </div>
          ) : (
            <span className="text-[13px] text-fg-dim">
              {status.kind === 'exited' ? 'Session ended' : 'Disconnected from server'}
            </span>
          )}
          {status.kind === 'disconnected' ? (
            <Button variant="primary" size="sm" onClick={retry}>
              <RotateCw size={12} />
              Reconnect
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={restart}>
              <RotateCw size={12} />
              Restart session
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
