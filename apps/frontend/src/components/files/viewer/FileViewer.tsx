import { useEffect, useState } from 'react';
import { fsReadUrl } from '../../../api/fs';
import { Spinner } from '../../ui/Spinner';
import { MAX_TEXT_VIEW_SIZE, isImageFile, isTextName } from '../format';
import { CodeView } from './CodeView';
import { detectLang } from './lang';
import { ViewerHeader } from './ViewerHeader';

/**
 * Read-only file viewer overlay (gitbase's CodeFileView adapted to zector):
 * images render a centered preview, SVGs get a Preview/Code toggle, text files
 * get line numbers + shiki highlighting, and binary/oversized files fall back
 * to a download message.
 */

export type ViewerFile = { path: string; name: string; size: number };

function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}

function useFileText(target: string, path: string, enabled: boolean) {
  const [state, setState] = useState<{ key: string; text: string | null; error: string | null }>({
    key: '',
    text: null,
    error: null,
  });
  const key = `${target}\n${path}`;
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch(fsReadUrl(target, path))
      .then(async (res) => {
        if (!res.ok) throw new Error(`could not read file (${res.status})`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setState({ key, text, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ key, text: null, error: err instanceof Error ? err.message : 'read failed' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [target, path, key, enabled]);
  return state.key === key ? state : { key, text: null, error: null };
}

function SvgToggle({ mode, onChange }: { mode: 'preview' | 'code'; onChange: (m: 'preview' | 'code') => void }) {
  const seg = (m: 'preview' | 'code', label: string) => (
    <button
      type="button"
      onClick={() => onChange(m)}
      className={`h-7 cursor-pointer px-2.5 text-[11px] transition-colors ${
        mode === m ? 'bg-white/12 text-fg' : 'text-fg-dim hover:text-fg'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex shrink-0 items-center overflow-hidden rounded-full bg-white/6">
      {seg('preview', 'Preview')}
      {seg('code', 'Code')}
    </div>
  );
}

function CenterMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center p-8 text-center text-[12px] text-fg-dim">{children}</div>;
}

export function FileViewer({ target, file, onClose }: { target: string; file: ViewerFile; onClose: () => void }) {
  useEscape(onClose);
  const [svgMode, setSvgMode] = useState<'preview' | 'code'>('preview');

  const isSvg = file.name.toLowerCase().endsWith('.svg');
  const isImage = isImageFile(file.name) && !isSvg;
  const isText = isSvg || isTextName(file.name);
  const tooLarge = file.size >= MAX_TEXT_VIEW_SIZE;
  const wantsText = isText && !tooLarge;
  const { text, error } = useFileText(target, file.path, wantsText);

  const code = text?.replace(/\n$/, '') ?? null;
  const showsCode = wantsText && (!isSvg || svgMode === 'code');
  const download = () => {
    const a = document.createElement('a');
    a.href = fsReadUrl(target, file.path, true);
    a.download = '';
    a.click();
  };
  const downloadLink = (
    <button type="button" onClick={download} className="cursor-pointer text-fg underline">
      Download
    </button>
  );

  let body: React.ReactNode;
  if (isImage || (isSvg && !showsCode && !tooLarge)) {
    body = (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-8">
        <img src={fsReadUrl(target, file.path)} alt={file.name} className="max-h-full max-w-full object-contain" />
      </div>
    );
  } else if (!isText) {
    body = <CenterMessage>Binary file. {downloadLink}</CenterMessage>;
  } else if (tooLarge) {
    body = <CenterMessage>File too large. {downloadLink}</CenterMessage>;
  } else if (error) {
    body = <CenterMessage>{error}</CenterMessage>;
  } else if (code === null) {
    body = (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size={18} />
      </div>
    );
  } else {
    body = <CodeView code={code} lang={detectLang(file.path)} />;
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-menu">
      <ViewerHeader
        name={file.name}
        lineCount={showsCode && code !== null ? code.split('\n').length : undefined}
        size={file.size}
        copyText={showsCode && code !== null ? code : undefined}
        onDownload={download}
        onClose={onClose}
      >
        {isSvg && !tooLarge && <SvgToggle mode={svgMode} onChange={setSvgMode} />}
      </ViewerHeader>
      {body}
    </div>
  );
}
