import { Fragment } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { LayoutNode } from '../../api/types';
import { useLayoutStore } from '../../store/layout';
import { BlockFrame } from './BlockFrame';

/** Recursively renders the layout tree with resizable panels. */
export function NodeView({ node }: { node: LayoutNode }) {
  const setSizes = useLayoutStore((s) => s.setSizes);

  if (node.type === 'leaf') {
    return <BlockFrame leaf={node} />;
  }

  const { id, dir, children, sizes } = node;
  const defaultLayout: Record<string, number> = {};
  children.forEach((child, i) => {
    defaultLayout[child.id] = sizes[i] > 0 ? sizes[i] : 1;
  });

  return (
    <Group
      // remount when the set of children changes so defaultLayout re-applies
      key={children.map((c) => c.id).join('|')}
      id={id}
      orientation={dir === 'row' ? 'horizontal' : 'vertical'}
      defaultLayout={defaultLayout}
      className="h-full w-full"
      onLayoutChanged={(layout, meta) => {
        if (!meta.isUserInteraction) return;
        setSizes(
          id,
          children.map((c) => layout[c.id] ?? 1),
        );
      }}
    >
      {children.map((child, i) => (
        <Fragment key={child.id}>
          {i > 0 && <Separator />}
          <Panel id={child.id} minSize={140} className="h-full w-full" style={{ overflow: 'hidden' }}>
            <NodeView node={child} />
          </Panel>
        </Fragment>
      ))}
    </Group>
  );
}
