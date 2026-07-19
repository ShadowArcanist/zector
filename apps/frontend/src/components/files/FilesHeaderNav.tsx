import { ChevronLeftIcon, ChevronRightIcon, RefreshIcon } from '../ui/icons/general';
import { useFilesNavStore } from '../../store/filesNav';

const NAV_BTN =
  'flex w-5 shrink-0 items-center justify-center py-1 text-fg transition-opacity not-disabled:cursor-pointer';

/** Back/forward history buttons shown in a files block header. */
export function FilesNavButtons({ leafId, target }: { leafId: string; target: string }) {
  const canBack = useFilesNavStore(
    (s) => (s.nav[leafId]?.target === target ? s.nav[leafId]!.back.length : 0) > 0,
  );
  const canForward = useFilesNavStore(
    (s) => (s.nav[leafId]?.target === target ? s.nav[leafId]!.forward.length : 0) > 0,
  );
  const goBack = useFilesNavStore((s) => s.goBack);
  const goForward = useFilesNavStore((s) => s.goForward);

  return (
    <div className="-ml-1 flex shrink-0 items-center">
      <button
        type="button"
        title="Back"
        aria-label="Back"
        disabled={!canBack}
        className={`${NAV_BTN} ${canBack ? 'opacity-70 hover:opacity-100' : 'opacity-25'}`}
        onClick={() => goBack(leafId)}
      >
        <ChevronLeftIcon size={15} />
      </button>
      <button
        type="button"
        title="Forward"
        aria-label="Forward"
        disabled={!canForward}
        className={`${NAV_BTN} ${canForward ? 'opacity-70 hover:opacity-100' : 'opacity-25'}`}
        onClick={() => goForward(leafId)}
      >
        <ChevronRightIcon size={15} />
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
