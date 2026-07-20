import type { LocalMachineInfo } from './types';
import { apiGet } from './http';

export function getLocalMachineInfo(): Promise<LocalMachineInfo> {
  return apiGet('/api/local-info');
}
