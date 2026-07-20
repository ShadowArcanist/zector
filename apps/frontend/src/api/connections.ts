import { apiGet, apiJson } from './http';
import type { Connection, ConnectionInput, TestResult } from './types';

export function listConnections(): Promise<Connection[]> {
  return apiGet('/api/connections');
}

export function createConnection(input: ConnectionInput): Promise<Connection> {
  return apiJson('POST', '/api/connections', input);
}

export function updateConnection(id: string, input: ConnectionInput): Promise<Connection> {
  return apiJson('PUT', `/api/connections/${id}`, input);
}

export function deleteConnection(id: string): Promise<void> {
  return apiJson('DELETE', `/api/connections/${id}`);
}

export function reorderConnections(ids: string[]): Promise<Connection[]> {
  return apiJson('PUT', '/api/connections/reorder', { ids });
}

export function testConnection(id: string): Promise<TestResult> {
  return apiJson('POST', `/api/connections/${id}/test`);
}
