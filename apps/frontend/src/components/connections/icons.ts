import { createElement, type ComponentType, type ReactElement } from 'react';
import type { Connection } from '../../api/types';
import type { IconProps } from '../ui/icons/Icon';
import {
  CloudIcon,
  CpuIcon,
  DatabaseIcon,
  GamepadIcon,
  GlobeIcon,
  HomeIcon,
  LockIcon,
  MonitorIcon,
  RouterIcon,
  ShieldIcon,
} from '../ui/icons/connections';
import { LaptopIcon, ServerIcon, SwapIcon } from '../ui/icons/terminal';

export type ConnIconDef = { key: string; name: string; Icon: ComponentType<IconProps> };

/** User-pickable per-connection icons (Connection.icon holds the key). */
export const CONN_ICONS: ConnIconDef[] = [
  { key: 'server', name: 'Server', Icon: ServerIcon },
  { key: 'database', name: 'Database', Icon: DatabaseIcon },
  { key: 'cloud', name: 'Cloud', Icon: CloudIcon },
  { key: 'globe', name: 'Globe', Icon: GlobeIcon },
  { key: 'laptop', name: 'Laptop', Icon: LaptopIcon },
  { key: 'monitor', name: 'Monitor', Icon: MonitorIcon },
  { key: 'cpu', name: 'CPU', Icon: CpuIcon },
  { key: 'shield', name: 'Shield', Icon: ShieldIcon },
  { key: 'lock', name: 'Lock', Icon: LockIcon },
  { key: 'home', name: 'Home', Icon: HomeIcon },
  { key: 'router', name: 'Router', Icon: RouterIcon },
  { key: 'gamepad', name: 'Gamepad', Icon: GamepadIcon },
];

/** Chosen icon component for a connection; SwapIcon when unset/unknown. */
export function connIcon(conn: Pick<Connection, 'icon'>): ComponentType<IconProps> {
  return CONN_ICONS.find((i) => i.key === conn.icon)?.Icon ?? SwapIcon;
}

/** Render helper for use directly inside a component body. */
export function connGlyph(conn: Pick<Connection, 'icon'>, props: IconProps): ReactElement {
  return createElement(connIcon(conn), props);
}
