import type { Block, LayoutNode, LeafNode } from '../api/types';

export const uuid = () => crypto.randomUUID();

export function makeLeaf(block: Block): LeafNode {
  return { type: 'leaf', id: uuid(), block };
}

export function findLeaf(node: LayoutNode | null, leafId: string): LeafNode | null {
  if (!node) return null;
  if (node.type === 'leaf') return node.id === leafId ? node : null;
  for (const child of node.children) {
    const found = findLeaf(child, leafId);
    if (found) return found;
  }
  return null;
}

/** Immutably replace the leaf `leafId` with a split of [old leaf, new leaf]. */
export function splitLeafInTree(
  node: LayoutNode,
  leafId: string,
  dir: 'row' | 'col',
  newLeaf: LeafNode,
): LayoutNode {
  if (node.type === 'leaf') {
    if (node.id !== leafId) return node;
    return { type: 'split', id: uuid(), dir, children: [node, newLeaf], sizes: [1, 1] };
  }
  return { ...node, children: node.children.map((c) => splitLeafInTree(c, leafId, dir, newLeaf)) };
}

/** Remove a leaf; collapse single-child splits. Returns null if the tree is now empty. */
export function removeLeafFromTree(node: LayoutNode, leafId: string): LayoutNode | null {
  if (node.type === 'leaf') return node.id === leafId ? null : node;
  const children: LayoutNode[] = [];
  const sizes: number[] = [];
  node.children.forEach((child, i) => {
    const kept = removeLeafFromTree(child, leafId);
    if (kept) {
      children.push(kept);
      sizes.push(node.sizes[i] ?? 1);
    }
  });
  if (children.length === 0) return null;
  if (children.length === 1) return children[0];
  return { ...node, children, sizes };
}

export function updateLeafBlockInTree(node: LayoutNode, leafId: string, block: Block): LayoutNode {
  if (node.type === 'leaf') {
    return node.id === leafId ? { ...node, block } : node;
  }
  return { ...node, children: node.children.map((c) => updateLeafBlockInTree(c, leafId, block)) };
}

export function setSizesInTree(node: LayoutNode, splitId: string, sizes: number[]): LayoutNode {
  if (node.type === 'leaf') return node;
  if (node.id === splitId) return { ...node, sizes };
  return { ...node, children: node.children.map((c) => setSizesInTree(c, splitId, sizes)) };
}

/** Collect termIds of all terminal blocks in a subtree (for cleanup on close). */
export function collectTermIds(node: LayoutNode | null): string[] {
  if (!node) return [];
  if (node.type === 'leaf') {
    return node.block.kind === 'terminal' ? [node.block.termId] : [];
  }
  return node.children.flatMap(collectTermIds);
}

export function firstLeafId(node: LayoutNode | null): string | null {
  if (!node) return null;
  if (node.type === 'leaf') return node.id;
  for (const child of node.children) {
    const id = firstLeafId(child);
    if (id) return id;
  }
  return null;
}

/** Loose runtime validation of a persisted node tree. */
export function isValidNode(value: unknown): value is LayoutNode {
  if (typeof value !== 'object' || value === null) return false;
  const node = value as Record<string, unknown>;
  if (typeof node.id !== 'string') return false;
  if (node.type === 'leaf') {
    const block = node.block as Record<string, unknown> | undefined;
    if (!block || typeof block !== 'object') return false;
    if (block.kind === 'terminal') {
      return typeof block.target === 'string' && typeof block.termId === 'string';
    }
    if (block.kind === 'files') {
      return typeof block.target === 'string' && typeof block.path === 'string';
    }
    return false;
  }
  if (node.type === 'split') {
    if (node.dir !== 'row' && node.dir !== 'col') return false;
    if (!Array.isArray(node.children) || node.children.length === 0) return false;
    if (!Array.isArray(node.sizes)) return false;
    return node.children.every(isValidNode);
  }
  return false;
}
