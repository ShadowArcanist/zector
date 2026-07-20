import { useCallback, useEffect, useState } from 'react';
import type { FilesBlockData, FsEntry } from '../../api/types';
import { fsDelete, fsHome, fsList, fsListSudo, fsMkdir, fsRename, fsWrite } from '../../api/fs';
import { ApiError } from '../../api/http';
import { useLayoutStore } from '../../store/layout';
import { ensureHome, useFilesNavStore } from '../../store/filesNav';
import { pushToast } from '../../store/toast';
import { joinPath } from './format';

export type UploadState = { current: number; total: number; name: string } | null;

const errMsg = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

type LoadResult = {
  key: string;
  entries: FsEntry[];
  error: string | null;
  errorStatus: number | null;
};

export function useFiles(leafId: string, block: FilesBlockData) {
  const updateLeafBlock = useLayoutStore((s) => s.updateLeafBlock);
  const recordVisit = useFilesNavStore((s) => s.recordVisit);
  const bumpRefresh = useFilesNavStore((s) => s.bumpRefresh);
  const setListing = useFilesNavStore((s) => s.setListing);
  // header refresh button bumps this; it is part of the fetch key below
  const refreshNonce = useFilesNavStore((s) => s.refreshNonce[leafId] ?? 0);
  const { target, path } = block;
  // Identifies the current fetch; loading/error/entries are derived from it so
  // effects never call setState synchronously.
  const key = `${target}\n${path}\n${refreshNonce}`;
  // Remounts (e.g. a block move re-nesting the panel tree) seed from the last
  // successful listing so rows render instantly while a refresh runs behind.
  const [result, setResult] = useState<LoadResult | null>(() => {
    const cached = useFilesNavStore.getState().listings[leafId];
    return cached && cached.key === key ? { ...cached, error: null, errorStatus: null } : null;
  });
  const [uploadState, setUploadState] = useState<UploadState>(null);
  const loading = result?.key !== key;
  const error = result?.key === key ? result.error : null;
  const errorStatus = result?.key === key ? result.errorStatus : null;
  // keep previous listing visible while a navigation loads (no flicker)
  const entries = result?.entries ?? [];

  const navigate = useCallback(
    (nextPath: string) => {
      if (nextPath === path) return;
      recordVisit(leafId, target, path);
      updateLeafBlock(leafId, { ...block, path: nextPath });
    },
    [leafId, target, path, block, recordVisit, updateLeafBlock],
  );

  useEffect(() => {
    let cancelled = false;
    ensureHome(target);
    if (path === '') {
      // freshly created block: resolve the target's home directory first
      fsHome(target)
        .then((res) => {
          if (!cancelled) navigate(res.path);
        })
        .catch((err) => {
          if (!cancelled) {
            setResult({
              key,
              entries: [],
              error: errMsg(err, 'Could not resolve home directory'),
              errorStatus: err instanceof ApiError ? err.status : null,
            });
          }
        });
    } else {
      fsList(target, path)
        .then((res) => {
          if (cancelled) return;
          setResult({ key, entries: res.entries, error: null, errorStatus: null });
          setListing(leafId, { key, entries: res.entries });
        })
        .catch((err) => {
          if (!cancelled) {
            setResult({
              key,
              entries: [],
              error: errMsg(err, 'Could not list directory'),
              errorStatus: err instanceof ApiError ? err.status : null,
            });
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [key, target, path, navigate, leafId, setListing]);

  const refresh = useCallback(() => bumpRefresh(leafId), [leafId, bumpRefresh]);

  const listAsSudo = useCallback(
    async (password: string): Promise<string | null> => {
      try {
        const res = await fsListSudo(path, password);
        setResult({ key, entries: res.entries, error: null, errorStatus: null });
        setListing(leafId, { key, entries: res.entries });
        return null;
      } catch (err) {
        return errMsg(err, 'Could not list directory as sudo');
      }
    },
    [path, key, leafId, setListing],
  );

  const mkdir = useCallback(
    async (name: string) => {
      try {
        await fsMkdir(target, joinPath(path, name));
        refresh();
      } catch (err) {
        pushToast('error', errMsg(err, 'Could not create folder'));
      }
    },
    [target, path, refresh],
  );

  const rename = useCallback(
    async (from: string, toName: string) => {
      try {
        await fsRename(target, from, joinPath(path, toName));
        refresh();
      } catch (err) {
        pushToast('error', errMsg(err, 'Rename failed'));
      }
    },
    [target, path, refresh],
  );

  const remove = useCallback(
    async (entryPath: string) => {
      try {
        await fsDelete(target, entryPath);
        refresh();
      } catch (err) {
        pushToast('error', errMsg(err, 'Delete failed'));
      }
    },
    [target, refresh],
  );

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadState({ current: i + 1, total: files.length, name: file.name });
        try {
          await fsWrite(target, joinPath(path, file.name), file);
        } catch (err) {
          pushToast('error', `Upload of ${file.name} failed: ${errMsg(err, 'unknown error')}`);
        }
      }
      setUploadState(null);
      refresh();
    },
    [target, path, refresh],
  );

  return {
    entries,
    loading,
    error,
    errorStatus,
    uploadState,
    navigate,
    refresh,
    listAsSudo,
    mkdir,
    rename,
    remove,
    upload,
  };
}
