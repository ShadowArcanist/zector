import { apiGet, apiJson, apiRaw } from './http';
import type { FsEntry, FsListing } from './types';

const base = (target: string) => `/api/fs/${encodeURIComponent(target)}`;

export function fsHome(target: string): Promise<{ path: string }> {
  return apiGet(`${base(target)}/home`);
}

export function fsList(target: string, path: string): Promise<FsListing> {
  return apiGet(`${base(target)}/list?path=${encodeURIComponent(path)}`);
}

export function fsStat(target: string, path: string): Promise<FsEntry> {
  return apiGet(`${base(target)}/stat?path=${encodeURIComponent(path)}`);
}

/** URL for raw file content (image preview, editor fetch, downloads). */
export function fsReadUrl(target: string, path: string, download = false): string {
  return `${base(target)}/read?path=${encodeURIComponent(path)}${download ? '&download=1' : ''}`;
}

export function fsWrite(target: string, path: string, body: Blob | string): Promise<void> {
  return apiRaw('POST', `${base(target)}/write?path=${encodeURIComponent(path)}`, body);
}

export function fsMkdir(target: string, path: string): Promise<void> {
  return apiJson('POST', `${base(target)}/mkdir`, { path });
}

export function fsRename(target: string, from: string, to: string): Promise<void> {
  return apiJson('POST', `${base(target)}/rename`, { from, to });
}

export function fsDelete(target: string, path: string): Promise<void> {
  return apiJson('POST', `${base(target)}/delete`, { path });
}
