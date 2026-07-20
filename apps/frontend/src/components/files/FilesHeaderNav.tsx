import { ChevronLeftIcon, RefreshIcon } from '../ui/icons/general';
import { useFilesNavStore } from '../../store/filesNav';

const NAV_BTN =
  'flex w-5 shrink-0 items-center justify-center py-1 text-fg transition-opacity not-disabled:cursor-pointer';

/**
 * Wave-style parent button: a file returns to its containing directory and a
 * directory goes up one level. Dirty editors keep the discard confirmation.
 */
export function FilesNavButtons({ leafId, path, restoredFile }: { leafId: string; path: string; restoredFile: boolean }) {
  const hasOpenFile = useFilesNavStore((s) => !!s.openFiles[leafId]);
  const goParent = useFilesNavStore((s) => s.goParent);
  const canGoParent = hasOpenFile || restoredFile || (path !== '' && path !== '/');

  return (
    <div className="-ml-1 flex shrink-0 items-center">
      <button
        type="button"
        title="Parent directory"
        aria-label="Parent directory"
        disabled={!canGoParent}
        className={`${NAV_BTN} ${canGoParent ? 'opacity-70 hover:opacity-100' : 'opacity-25'}`}
        onClick={() => goParent(leafId)}
      >
        <ChevronLeftIcon size={12} />
      </button>
    </div>
  );
}

/** Refresh end-icon for files block headers (bumps the block's refresh nonce). */
export function FilesRefreshButton({ leafId, className }: { leafId: string; className: string }) {
  const bumpRefresh = useFilesNavStore((s) => s.bumpRefresh);
  return (
    <button
      type="button"
      title="Refresh"
      aria-label="Refresh"
      className={className}
      onClick={() => bumpRefresh(leafId)}
    >
      <RefreshIcon size={13} />
    </button>
  );
}
