import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import { fsReadUrl, fsWrite } from '../../api/fs';
import { pushToast } from '../../store/toast';
import { Button, IconButton } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}

export function ImageOverlay({ target, path, onClose }: { target: string; path: string; onClose: () => void }) {
  useEscape(onClose);
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-bg0/95">
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-edge px-2">
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-fg-dim">{path}</span>
        <IconButton onClick={onClose} aria-label="Close preview">
          <X size={14} />
        </IconButton>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
        <img src={fsReadUrl(target, path)} alt={path} className="max-h-full max-w-full object-contain" />
      </div>
    </div>
  );
}

export function EditorOverlay({ target, path, onClose }: { target: string; path: string; onClose: () => void }) {
  const [text, setText] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useEscape(onClose);

  useEffect(() => {
    let cancelled = false;
    fetch(fsReadUrl(target, path))
      .then(async (res) => {
        if (!res.ok) throw new Error(`could not read file (${res.status})`);
        return res.text();
      })
      .then((content) => {
        if (!cancelled) setText(content);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'read failed');
      });
    return () => {
      cancelled = true;
    };
  }, [target, path]);

  const save = async () => {
    if (text === null) return;
    setSaving(true);
    try {
      await fsWrite(target, path, text);
      setDirty(false);
      pushToast('ok', 'File saved');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-bg0/97">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-edge px-2">
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-fg-dim">
          {path}
          {dirty && <span className="ml-1 text-warn">●</span>}
        </span>
        <Button size="sm" variant="primary" onClick={() => void save()} disabled={saving || text === null || !dirty}>
          {saving ? <Spinner size={11} className="text-white" /> : <Save size={12} />}
          Save
        </Button>
        <IconButton onClick={onClose} aria-label="Close editor">
          <X size={14} />
        </IconButton>
      </div>
      {loadError ? (
        <p className="p-4 text-[13px] text-danger">{loadError}</p>
      ) : text === null ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner size={18} />
        </div>
      ) : (
        <textarea
          value={text}
          spellCheck={false}
          className="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[12.5px] leading-relaxed text-fg outline-none"
          onChange={(e) => {
            setText(e.target.value);
            setDirty(true);
          }}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
              e.preventDefault();
              void save();
            }
          }}
        />
      )}
    </div>
  );
}
