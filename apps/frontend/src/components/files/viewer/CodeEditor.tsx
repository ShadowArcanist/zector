import { useEffect, useRef, useState } from 'react';
import { highlightCode, highlightCodeSync } from './highlight';

/**
 * Editable code surface: a transparent-text <textarea> exactly overlaying the
 * shiki-highlighted markup (react-simple-code-editor technique, hand-rolled).
 * One scroll container holds a sticky line-number gutter plus a wrapper sized
 * by an invisible <pre> containing the CURRENT text, so the absolutely
 * stacked highlight layer and textarea always fit without internal scrolling.
 * Shiki loads asynchronously for the first paint. Once its grammar is ready,
 * edits re-highlight synchronously so typed text never drops to plain white;
 * the debounced effect remains as a fallback for newly loaded languages.
 */

const FONT = 'font-mono text-[12px] leading-5';
const PAD = 'px-3 py-1.5';
const HIGHLIGHT_PRE =
  '[&_code]:text-[12px] [&_pre]:px-3 [&_pre]:py-1.5 [&_pre]:leading-5 [&_pre]:whitespace-pre';

function LineNumbers({ count }: { count: number }) {
  return (
    <div
      className={`sticky left-0 z-10 flex w-11 shrink-0 flex-col items-end border-r border-white/6 px-2 py-1.5 ${FONT} text-fg-faint tabular-nums select-none`}
    >
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>{i + 1}</span>
      ))}
    </div>
  );
}

export function CodeEditor({
  value,
  lang,
  onChange,
  readOnly = false,
  caretColor,
  selectionBackground,
  wordWrap,
}: {
  value: string;
  lang: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
  caretColor: string;
  selectionBackground?: string;
  wordWrap: boolean;
}) {
  const [html, setHtml] = useState<{ source: string; lang: string; markup: string } | null>(null);
  const highlightStarted = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      void highlightCode(value, lang).then((h) => {
        if (cancelled) return;
        setHtml({ source: value, lang, markup: h });
      });
    };
    if (!highlightStarted.current) {
      highlightStarted.current = true;
      run(); // first paint: highlight immediately
      return () => {
        cancelled = true;
      };
    }
    const timer = setTimeout(run, 120); // edits: debounce, keep last-good highlight
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value, lang]);

  const applyChange = (next: string) => {
    const markup = highlightCodeSync(next, lang);
    if (markup !== null) setHtml({ source: next, lang, markup });
    onChange(next);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && !readOnly) {
      e.preventDefault();
      const ta = e.currentTarget;
      ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
      applyChange(ta.value);
    }
  };

  return (
    <div className={`min-h-0 flex-1 overflow-auto ${FONT}`}>
      <div className={`flex ${wordWrap ? 'w-full min-w-0' : 'min-w-fit'}`}>
        {!wordWrap && <LineNumbers count={value.split('\n').length} />}
        <div className={`relative flex-1 ${wordWrap ? 'min-w-0' : ''}`}>
          {/* invisible sizer: current text (+1 char of caret room) sets the layer size */}
          <pre
            aria-hidden
            className={`invisible ${wordWrap ? 'py-1.5 pr-3 pl-14 whitespace-pre-wrap wrap-anywhere' : `${PAD} whitespace-pre`} ${FONT}`}
          >
            {`${value} `}
          </pre>
          {html?.source === value && html.lang === lang ? (
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 overflow-hidden ${wordWrap ? 'code-editor-wrap' : HIGHLIGHT_PRE}`}
              // shiki output is trusted (generated locally from file text)
              dangerouslySetInnerHTML={{ __html: html.markup }}
            />
          ) : (
            wordWrap ? (
              <pre aria-hidden className={`code-editor-wrap pointer-events-none absolute inset-0 overflow-hidden ${FONT} text-fg`}>
                <code>
                  {value.split('\n').map((line, index) => (
                    <span className="line" key={index}>{line || '\u200b'}</span>
                  ))}
                </code>
              </pre>
            ) : (
              <pre aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${PAD} ${FONT} whitespace-pre text-fg`}>
                {value}
              </pre>
            )
          )}
          <textarea
            value={value}
            onChange={(e) => applyChange(e.target.value)}
            onKeyDown={onKeyDown}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            wrap={wordWrap ? 'soft' : 'off'}
            aria-label="File contents"
            style={{ caretColor, '--sel': selectionBackground ?? 'rgb(61 64 67)' } as React.CSSProperties}
            className={`absolute inset-0 resize-none overflow-hidden bg-transparent ${wordWrap ? 'py-1.5 pr-3 pl-14 whitespace-pre-wrap wrap-anywhere' : `${PAD} whitespace-pre`} ${FONT} text-transparent outline-none selection:bg-(--sel)`}
          />
        </div>
      </div>
    </div>
  );
}
