import { ArrowDownIcon, ArrowUpIcon } from '../ui/icons/general';
import { useFilesNavStore } from '../../store/filesNav';
import {
  COLUMNS,
  MAX_COL_WIDTH,
  MIN_COL_WIDTH,
  NAME_MIN_WIDTH,
  rowMinWidth,
  type ColWidths,
  type FixedColKey,
  type SortState,
} from './columns';

/**
 * Drag handle on a fixed column's left edge (the boundary follows the cursor:
 * dragging left widens the column, Name flexes). Double-click resets it.
 */
function ColDivider({ leafId, colKey, width }: { leafId: string; colKey: FixedColKey; width: number }) {
  const setColWidth = useFilesNavStore((s) => s.setColWidth);
  const resetColWidth = useFilesNavStore((s) => s.resetColWidth);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    document.body.classList.add('col-resizing');
    const onMove = (ev: PointerEvent) => {
      const next = Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, width - (ev.clientX - startX)));
      setColWidth(leafId, colKey, next);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.classList.remove('col-resizing');
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      className="group/divider absolute inset-y-0 -left-[3px] z-10 flex w-[5px] cursor-col-resize justify-center"
      onPointerDown={onPointerDown}
      onDoubleClick={() => resetColWidth(leafId, colKey)}
    >
      <div className="h-full w-px bg-accent/70 opacity-0 transition-opacity group-hover/divider:opacity-100" />
    </div>
  );
}

/** Sticky sortable header row with resizable column dividers. */
export function FileTableHeader({
  leafId,
  widths,
  sort,
  onToggleSort,
}: {
  leafId: string;
  widths: ColWidths;
  sort: SortState;
  onToggleSort: (key: SortState['key']) => void;
}) {
  return (
    <div
      className="sticky top-0 z-10 flex h-[26px] shrink-0 items-center border-b border-white/8 bg-white/4 px-2 backdrop-blur-[8px]"
      style={{ minWidth: rowMinWidth(widths) }}
    >
      {COLUMNS.map((col) => {
        const active = sort.key === col.key;
        const Arrow = sort.dir === 'asc' ? ArrowUpIcon : ArrowDownIcon;
        const sortButton = (
          <button
            type="button"
            className={`flex w-full cursor-pointer items-center gap-1 text-[11px] font-medium select-none ${
              col.key === 'size' ? 'justify-end' : ''
            } ${col.key === 'type' ? 'pl-3' : ''} ${
              active ? 'text-fg' : 'text-fg-dim hover:text-fg'
            }`}
            onClick={() => onToggleSort(col.key)}
          >
            {col.label}
            {active && <Arrow size={10} className="shrink-0" />}
          </button>
        );
        if (col.key === 'name') {
          return (
            <div key={col.key} className="flex-1" style={{ minWidth: NAME_MIN_WIDTH }}>
              {sortButton}
            </div>
          );
        }
        return (
          <div key={col.key} className="relative shrink-0" style={{ width: widths[col.key] }}>
            <ColDivider leafId={leafId} colKey={col.key} width={widths[col.key]} />
            {sortButton}
          </div>
        );
      })}
    </div>
  );
}
