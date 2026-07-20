import type { Connection } from '../../api/types';

/** Wave's connection color ramp, now user-pickable per connection. */
export const CONN_COLORS = [
  { value: '#53b4ea', name: 'Sky' },
  { value: '#aa67ff', name: 'Purple' },
  { value: '#fda7fd', name: 'Pink' },
  { value: '#ef476f', name: 'Red' },
  { value: '#497bf8', name: 'Blue' },
  { value: '#ffa24e', name: 'Orange' },
  { value: '#dbde52', name: 'Yellow' },
  { value: '#58c142', name: 'Green' },
  { value: '#14b8a6', name: 'Teal' },
  { value: '#6366f1', name: 'Indigo' },
  { value: '#84cc16', name: 'Lime' },
  { value: '#94a3b8', name: 'Slate' },
];

/** Chosen icon color, else a stable hash-picked one ("Auto"). */
export function connColor(conn: Pick<Connection, 'id' | 'icon_color'>): string {
  if (conn.icon_color) return conn.icon_color;
  let h = 0;
  for (let i = 0; i < conn.id.length; i++) h = (h * 31 + conn.id.charCodeAt(i)) >>> 0;
  return CONN_COLORS[h % CONN_COLORS.length].value;
}
