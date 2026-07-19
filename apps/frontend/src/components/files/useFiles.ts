import { useCallback, useEffect, useState } from 'react';
import type { FilesBlockData, FsEntry } from '../../api/types';
import { fsDelete, fsHome, fsList, fsMkdir, fsRename, fsWrite } from '../../api/fs';
import { useLayoutStore } from '../../store/layout';
import { pushToast } from '../../store/toast';
import { joinPath } from './format';

export type UploadState = { current: number; total: number; name: string } | null;

const errMsg = (err: unknown, fallback: string) =>
  err instanceof Error ? err.message : fallback;

type LoadResult = { key: string; entries: FsEntry[]; error: string | null };

export function useFiles(leafId: string, block: FilesBlockData) {
  const updateLeafBlock = useLayoutStore((s) => s.updateLeafBlock);
  const { target, path } = block;
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>(null);

  // Identifies the current fetch; loading/error/entries are derived from it so
  // effects never call setState synchronously.
  const key = `${target}\n${path}\n${refreshNonce}`;
  const loading = result?.key !== key;
  const error = result?.key === key ? result.error : null;
  // keep previous listing visible while a navigation loads (no flicker)
  const entries = result?.entries ?? [];

  const navigate = useCallback(
    (nextPath: string) => {
      updateLeafBlock(leafId, { kind: 'files', target, path: nextPath });
    },
    [leafId, target, updateLeafBlock],
  );

  useEffect(() => {
    let cancelled = false;
    if (path === '') {
      // freshly created block: resolve the target's home directory first
      fsHome(target)
        .then((res) => {
          if (!cancelled) navigate(res.path);
        })
        .catch((err) => {
          if (!cancelled) {
            setResult({ key, entries: [], error: errMsg(err, 'Could not resolve home directory') });
          }
        });
    } else {
      fsList(target, path)
        .then((res) => {
          if (!cancelled) setResult({ key, entries: res.entries, error: null });
        })
        .catch((err) => {
          if (!cancelled) {
            setResult({ key, entries: [], error: errMsg(err, 'Could not list directory') });
          }
        });
    }
    return () => {
      cancelled = true;
    };
  }, [key, target, path, navigate]);

  const refresh = useCallback(() => setRefreshNonce((n) => n + 1), []);

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

  return { entries, loading, error, uploadState, navigate, refresh, mkdir, rename, remove, upload };
}
