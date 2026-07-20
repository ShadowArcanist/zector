import { Suspense, use } from 'react';
import { highlightCode } from './highlight';

/**
 * Scrollable code pane: sticky line-number gutter + shiki-highlighted source.
 * While shiki (and the grammar chunk) loads, a pulsing per-line skeleton with
 * the real line widths keeps the layout stable — structure copied from
 * gitbase's CodeFileView.
 */

function LineNumbers({ count }: { count: number }) {
  return (
    <div className="sticky left-0 z-10 flex w-11 shrink-0 flex-col items-end border-r border-white/6 bg-menu px-2 py-3 font-mono text-[12px] leading-5 text-fg-faint tabular-nums select-none">
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>{i + 1}</span>
      ))}
    </div>
  );
}

function CodeSkeleton({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <div className="flex min-w-fit">
      <LineNumbers count={lines.length} />
      <div className="flex-1 p-3">
        {lines.map((line, i) => (
          <div key={i} className="h-5">
            {line.trim() && (
              <span
                className="inline-block animate-pulse rounded bg-white/8"
                style={{ width: `${Math.min(Math.max(line.length, 3), 80)}ch`, height: '0.7rem', marginTop: '0.25rem' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HighlightedCode({ code, lang }: { code: string; lang: string }) {
  const html = use(highlightCode(code, lang));
  return (
    <div className="flex min-w-fit">
      <LineNumbers count={code.split('\n').length} />
      <div
        className="flex-1 [&_code]:text-[12px] [&_pre]:p-3 [&_pre]:leading-5 [&_pre]:outline-none"
        // shiki output is trusted (generated locally from file text)
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export function CodeView({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="min-h-0 flex-1 overflow-auto font-mono text-[12px] leading-5">
      <Suspense fallback={<CodeSkeleton code={code} />}>
        <HighlightedCode code={code} lang={lang} />
      </Suspense>
    </div>
  );
}
