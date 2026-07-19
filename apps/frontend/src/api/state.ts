import { apiGet, apiJson } from './http';

/** The backend stores this blob opaquely; validate shape on the caller side. */
export function getUiState(): Promise<unknown> {
  return apiGet('/api/state');
}

export function putUiState(state: unknown): Promise<void> {
  return apiJson('PUT', '/api/state', state);
}
