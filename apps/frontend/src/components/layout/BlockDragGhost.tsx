import { useBlockDragStore } from './blockDrag';

/** Small floating label (the dragged block's title) that follows the cursor. */
export function BlockDragGhost() {
  const srcLeafId = useBlockDragStore((s) => s.srcLeafId);
  const title = useBlockDragStore((s) => s.title);
  const x = useBlockDragStore((s) => s.x);
  const y = useBlockDragStore((s) => s.y);

  if (!srcLeafId) return null;
  return (
    <div
      className="pointer-events-none fixed z-[90] max-w-60 truncate rounded-md border border-edge2 bg-bg2 px-2 py-0.5 text-[11px] text-fg-dim shadow-modal"
      style={{ left: x + 12, top: y + 14 }}
    >
      {title}
    </div>
  );
}
