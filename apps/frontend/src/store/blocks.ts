import type { Block } from '../api/types';
import { killTerm } from '../api/term';
import { useLayoutStore } from './layout';
import { findLeaf, uuid } from './tree';

/** Look up a leaf's current block across all tabs. */
export function blockForLeaf(leafId: string): Block | null {
  const { tabs } = useLayoutStore.getState();
  for (const tab of tabs) {
    const leaf = findLeaf(tab.root, leafId);
    if (leaf) return leaf.block;
  }
  return null;
}

function patch(leafId: string, next: Block) {
  useLayoutStore.getState().updateLeafBlock(leafId, next);
}

/** Set (or clear with '') a custom block title. */
export function renameBlock(leafId: string, title: string) {
  const block = blockForLeaf(leafId);
  if (!block) return;
  patch(leafId, { ...block, title: title.trim() || undefined });
}

/** Per-block terminal font size; undefined = default (13). */
export function setTermFontSize(leafId: string, fontSize: number | undefined) {
  const block = blockForLeaf(leafId);
  if (block?.kind !== 'terminal') return;
  patch(leafId, { ...block, fontSize });
}

/**
 * Point a block at a different target. Terminals get a fresh session (the old
 * one is killed); files blocks navigate to the new target's home directory.
 */
export function switchBlockTarget(leafId: string, target: string) {
  const block = blockForLeaf(leafId);
  if (!block || block.target === target) return;
  if (block.kind === 'terminal') {
    killTerm(block.termId).catch(() => {});
    patch(leafId, { ...block, target, termId: uuid() });
  } else {
    patch(leafId, { ...block, target, path: '' });
  }
}
