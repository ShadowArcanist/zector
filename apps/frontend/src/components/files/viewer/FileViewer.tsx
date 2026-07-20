import { useCallback, useEffect, useState } from 'react';
import { fsReadUrl, fsWrite } from '../../../api/fs';
import { resolveTermTheme, useConfigStore } from '../../../store/config';
import { useFilesNavStore, type OpenFile } from '../../../store/filesNav';
import { useLayoutStore } from '../../../store/layout';
import { pushToast } from '../../../store/toast';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { Spinner } from '../../ui/Spinner';
import { MAX_TEXT_VIEW_SIZE, isImageFile, isTextName } from '../format';
import { CodeEditor } from './CodeEditor';
import { detectLang } from './lang';
import { useFileText } from './useFileText';
import { SvgToggle, ViewerHeader } from './ViewerHeader';

/**
 * File editor overlay: images render a centered preview, SVGs get a
 * Preview/Code toggle (code stays read-only), text files open in the editable
 * CodeEditor with Cmd/Ctrl+S + header Save, and binary/oversized files fall
 * back to a download message. Open/dirty state lives in the filesNav store so
 * the block header + back button can see it; closing with unsaved edits goes
 * through the store's confirm flow (ConfirmModal below).
 */

function CenterMessage({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 items-center justify-center p-8 text-center text-[12px] text-fg-dim">{children}</div>;
}

export function FileViewer({ leafId, file }: { leafId: string; file: OpenFile }) {
  const { target } = file;
  const setFileDirty = useFilesNavStore((s) => s.setFileDirty);
  const requestCloseFile = useFilesNavStore((s) => s.requestCloseFile);
  const cancelCloseFile = useFilesNavStore((s) => s.cancelCloseFile);
  const closeFile = useFilesNavStore((s) => s.closeFile);
  const confirming = useFilesNavStore((s) => !!s.openFiles[leafId]?.confirmingClose);
  // Editor surface follows the terminal background behavior (TerminalBlock):
  // active-tab bg preset → transparent so the gradient shows, else theme bg.
  const transparent = useLayoutStore((s) => !!s.tabs.find((t) => t.id === s.activeTabId)?.bg);
  const settings = useConfigStore((s) => s.settings);
  const termThemes = useConfigStore((s) => s.termThemes);
  const theme = resolveTermTheme(termThemes, settings.termTheme);
  const themeBg = theme.background ?? '#141414';

  const [svgMode, setSvgMode] = useState<'preview' | 'code'>('preview');
  const isSvg = file.name.toLowerCase().endsWith('.svg');
  const isImage = isImageFile(file.name) && !isSvg;
  const isText = isSvg || isTextName(file.name);
  const tooLarge = file.size >= MAX_TEXT_VIEW_SIZE;
  const wantsText = isText && !tooLarge;
  const { key, text, error } = useFileText(target, file.path, wantsText);

  // Loaded baseline (updated on save) vs edited draft, both keyed to the file.
  const [base, setBase] = useState<{ key: string; value: string } | null>(null);
  const [draft, setDraft] = useState<{ key: string; value: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const baseline = base?.key === key ? base.value : text;
  const value = draft?.key === key ? draft.value : baseline;
  const dirty = baseline !== null && value !== null && value !== baseline;

  useEffect(() => {
    setFileDirty(leafId, dirty);
  }, [leafId, dirty, setFileDirty]);

  const save = useCallback(async () => {
    if (value === null) return;
    setSaving(true);
    try {
      await fsWrite(target, file.path, value);
      setBase({ key, value });
      pushToast('ok', 'Saved');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [target, file.path, key, value]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!confirming) requestCloseFile(leafId);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !saving) void save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [leafId, confirming, dirty, saving, save, requestCloseFile]);

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
  } else if (value === null) {
    body = (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size={18} />
      </div>
    );
  } else {
    body = (
      <CodeEditor
        value={value}
        lang={detectLang(file.path)}
        onChange={(next) => setDraft({ key, value: next })}
        readOnly={isSvg}
        caretColor={theme.foreground ?? '#d4d4d4'}
        selectionBackground={theme.selectionBackground}
        gutterBackground={transparent ? 'rgb(0 0 0 / 0.4)' : themeBg}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col"
      style={{ background: transparent ? 'transparent' : themeBg }}
    >
      <ViewerHeader
        name={file.name}
        lineCount={showsCode && value !== null ? value.split('\n').length : undefined}
        size={file.size}
        copyText={showsCode && value !== null ? value : undefined}
        dirty={dirty && !isSvg}
        saving={saving}
        onSave={() => void save()}
        onDownload={download}
        onClose={() => requestCloseFile(leafId)}
      >
        {isSvg && !tooLarge && <SvgToggle mode={svgMode} onChange={setSvgMode} />}
      </ViewerHeader>
      {body}
      {confirming && (
        <ConfirmModal
          title="Discard changes?"
          body={`You have unsaved edits in ${file.name}.`}
          confirmLabel="Discard"
          onCancel={() => cancelCloseFile(leafId)}
          onConfirm={() => closeFile(leafId)}
        />
      )}
    </div>
  );
}
