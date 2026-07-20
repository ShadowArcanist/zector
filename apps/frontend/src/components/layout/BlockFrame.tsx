import type { LeafNode } from '../../api/types';
import type { DropEdge } from '../../store/tree';
import { useLayoutStore } from '../../store/layout';
import { useConfigStore } from '../../store/config';
import { TerminalBlock } from '../terminal/TerminalBlock';
import { FilesBlock } from '../files/FilesBlock';
import { BlockHeader } from './BlockHeader';
import { useBlockDragStore } from './blockDrag';

/** Wave-like drop preview: accent overlay on the half where the block lands. */
const EDGE_CLASS: Record<DropEdge, string> = {
  left: 'inset-y-0 left-0 w-1/2',
  right: 'inset-y-0 right-0 w-1/2',
  top: 'inset-x-0 top-0 h-1/2',
  bottom: 'inset-x-0 bottom-0 h-1/2',
};

/** Wave-style block: 8px radius, translucent bg. */
export function BlockFrame({ leaf }: { leaf: LeafNode }) {
  const setFocusedLeaf = useLayoutStore((s) => s.setFocusedLeaf);
  const dropEdge = useBlockDragStore((s) => (s.over?.leafId === leaf.id ? s.over.edge : null));
  const isDragSrc = useBlockDragStore((s) => s.srcLeafId === leaf.id);
  // Focused-block highlight: toggled in settings.json, styled by the active background.
  const focused = useLayoutStore((s) => s.focusedLeafId === leaf.id);
  const highlightOn = useConfigStore((s) => s.settings.blockHighlight);
  const bgKey = useLayoutStore((s) => s.tabs.find((t) => t.id === s.activeTabId)?.bg);
  const preset = useConfigStore((s) =>
    bgKey ? s.backgrounds.find((b) => b.key === bgKey) : undefined,
  );
  const { block } = leaf;

  return (
    <section
      data-leaf-id={leaf.id}
      className={`group/block relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-lg bg-block transition-opacity [backdrop-filter:var(--block-blur)] ${
        isDragSrc ? 'opacity-50' : ''
      }`}
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
      {highlightOn && focused && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-40 rounded-lg"
          style={{
            border: `${preset?.highlightWidth ?? 2}px solid ${
              preset?.highlightColor ?? preset?.accent ?? 'var(--color-accent)'
            }`,
          }}
        />
      )}
      {dropEdge && (
        <div
          className={`pointer-events-none absolute z-30 rounded-md border-2 border-accent/70 bg-accent/25 ${EDGE_CLASS[dropEdge]}`}
        />
      )}
    </section>
  );
}
