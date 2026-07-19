import type { LeafNode } from '../../api/types';
import { useLayoutStore } from '../../store/layout';
import { TerminalBlock } from '../terminal/TerminalBlock';
import { FilesBlock } from '../files/FilesBlock';
import { BlockHeader } from './BlockHeader';

/** Wave-style block: 8px radius, translucent bg, 2px accent border when focused. */
export function BlockFrame({ leaf }: { leaf: LeafNode }) {
  const focused = useLayoutStore((s) => s.focusedLeafId === leaf.id);
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
      {/* block-mask: focus ring drawn above content, never intercepts input */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 z-40 rounded-lg border-2 ${
          focused ? 'border-accent' : 'border-transparent'
        }`}
      />
    </section>
  );
}
