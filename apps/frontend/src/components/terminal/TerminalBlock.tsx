import { AlertIcon, RestartIcon } from '../ui/icons/general';
import type { TerminalBlockData } from '../../api/types';
import { killTerm } from '../../api/term';
import { useLayoutStore } from '../../store/layout';
import { resolveTermTheme, useConfigStore } from '../../store/config';
import { openContextMenu } from '../../store/contextMenu';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useTermSession } from './useTermSession';
import { buildTermMenu } from './termMenu';

export function TerminalBlock({ leafId, block }: { leafId: string; block: TerminalBlockData }) {
  const updateLeafBlock = useLayoutStore((s) => s.updateLeafBlock);
  // Tab background preset showing? Terminals go transparent so it shines through.
  const transparent = useLayoutStore((s) => !!s.tabs.find((t) => t.id === s.activeTabId)?.bg);
  // Config defaults; per-block termTheme/fontSize override them.
  const settings = useConfigStore((s) => s.settings);
  const termThemes = useConfigStore((s) => s.termThemes);
  const theme = resolveTermTheme(termThemes, block.termTheme ?? settings.termTheme);
  const fontSize = block.fontSize ?? settings.termFontSize;
  const { containerRef, status, focus, retry, getTerm } = useTermSession(
    block.termId,
    block.target,
    theme,
    fontSize,
    transparent,
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
      style={{ background: transparent ? 'transparent' : theme.background }}
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
              <AlertIcon size={16} className="mt-0.5 shrink-0" />
              <span className="break-words">{status.message}</span>
            </div>
          ) : (
            <span className="text-[13px] text-fg-dim">
              {status.kind === 'exited' ? 'Session ended' : 'Disconnected from server'}
            </span>
          )}
          {status.kind === 'disconnected' ? (
            <Button variant="primary" size="sm" onClick={retry}>
              <RestartIcon size={12} />
              Reconnect
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={restart}>
              <RestartIcon size={12} />
              Restart session
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
