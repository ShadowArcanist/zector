import type { LeafNode } from '../../api/types';
import { useLayoutStore } from '../../store/layout';
import { TerminalBlock } from '../terminal/TerminalBlock';
import { FilesBlock } from '../files/FilesBlock';
import { BlockHeader } from './BlockHeader';

/** Wave-style block: 8px radius, translucent bg. */
export function BlockFrame({ leaf }: { leaf: LeafNode }) {
  const setFocusedLeaf = useLayoutStore((s) => s.setFocusedLeaf);
  const { block } = leaf;

  return (
    <section
      className="group/block relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg bg-block"
      onMouseDownCapture={() => setFocusedLeaf(leaf.id)}
    >
      <BlockHeader leaf={leaf} />
      <div className="relative min-h-0 flex-1">
        {block.kind === 'terminal' ? (
          <TerminalBlock leafId={leaf.id} block={block} />
        ) : (
          <FilesBlock leafId={leaf.id} block={block} />
        )}
      </div>
    </section>
  );
}
