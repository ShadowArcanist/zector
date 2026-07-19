import { create } from 'zustand';
import { useLayoutStore } from '../../store/layout';
import type { DropEdge } from '../../store/tree';

/** Ephemeral state for the header-drag block rearrange gesture. */
type BlockDragState = {
  srcLeafId: string | null;
  title: string;
  x: number;
  y: number;
  over: { leafId: string; edge: DropEdge } | null;
};

export const useBlockDragStore = create<BlockDragState>(() => ({
  srcLeafId: null,
  title: '',
  x: 0,
  y: 0,
  over: null,
}));

const THRESHOLD_PX = 5;

/** Find the block under the cursor and its nearest-edge drop zone (4 triangles). */
function hitTest(x: number, y: number, srcLeafId: string): BlockDragState['over'] {
  const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-leaf-id]');
  const leafId = el?.dataset.leafId;
  if (!el || !leafId || leafId === srcLeafId) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const relX = (x - rect.left) / rect.width - 0.5;
  const relY = (y - rect.top) / rect.height - 0.5;
  const edge: DropEdge =
    Math.abs(relX) >= Math.abs(relY) ? (relX < 0 ? 'left' : 'right') : (relY < 0 ? 'top' : 'bottom');
  return { leafId, edge };
}

/**
 * Pointer-based drag of a block by its header. Activates after a small
 * movement threshold so plain clicks / double-click rename keep working.
 * Esc or releasing outside any other block cancels; dropping on another
 * block re-tiles the tab via `moveLeaf` (same leaf node, session survives).
 */
export function startBlockDrag(e: React.PointerEvent, srcLeafId: string, title: string) {
  if (e.button !== 0) return;
  if ((e.target as Element).closest('button, input')) return;
  const startX = e.clientX;
  const startY = e.clientY;
  let active = false;

  const cleanup = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', cleanup);
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('blur', cleanup);
    document.body.classList.remove('block-dragging');
    useBlockDragStore.setState({ srcLeafId: null, title: '', over: null });
  };

  const onKey = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      ev.stopPropagation();
      cleanup();
    }
  };

  const onMove = (ev: PointerEvent) => {
    if (!active) {
      if (
        Math.abs(ev.clientX - startX) < THRESHOLD_PX &&
        Math.abs(ev.clientY - startY) < THRESHOLD_PX
      ) {
        return;
      }
      active = true;
      document.body.classList.add('block-dragging');
      useBlockDragStore.setState({ srcLeafId, title });
    }
    ev.preventDefault();
    useBlockDragStore.setState({
      x: ev.clientX,
      y: ev.clientY,
      over: hitTest(ev.clientX, ev.clientY, srcLeafId),
    });
  };

  const onUp = () => {
    const { over } = useBlockDragStore.getState();
    if (active && over) useLayoutStore.getState().moveLeaf(srcLeafId, over.leafId, over.edge);
    cleanup();
  };

  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', cleanup);
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('blur', cleanup);
}
