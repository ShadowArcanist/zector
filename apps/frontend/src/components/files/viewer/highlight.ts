/**
 * Lazy shiki highlighting for the file viewer, adapted from gitbase's
 * markdown highlighter: the shiki module (plus its wasm engine and grammar
 * chunks) is only dynamically imported once a viewer actually highlights
 * something, so none of it lands in the main bundle. Singleton highlighter,
 * grammars loaded on demand, and a per-(lang, code) promise cache so React's
 * `use()` can suspend on a stable promise.
 */

type Shiki = typeof import('shiki');
type Highlighter = Awaited<ReturnType<Shiki['createHighlighter']>>;
type Loaded = { shiki: Shiki; highlighter: Highlighter };

/** Dark theme; its #0d1117 background is swapped for transparent below so the
 * viewer's own bg-menu surface shows through. */
const THEME = 'github-dark-default';

let singleton: Promise<Loaded> | null = null;
let loaded: Loaded | null = null;

function getHighlighter(): Promise<Loaded> {
  singleton ??= import('shiki').then(async (shiki) => {
    loaded = {
      shiki,
      highlighter: await shiki.createHighlighter({ themes: [THEME], langs: [] }),
    };
    return loaded;
  });
  return singleton;
}

function toHtml({ highlighter }: Loaded, code: string, lang: string) {
  return highlighter.codeToHtml(code, {
    lang,
    theme: THEME,
    colorReplacements: { '#0d1117': 'transparent' },
  });
}

/** Re-highlight immediately while typing once the file's grammar is loaded. */
export function highlightCodeSync(code: string, lang: string): string | null {
  if (!loaded) return null;
  const effectiveLang = lang in loaded.shiki.bundledLanguages ? lang : 'text';
  if (effectiveLang !== 'text' && !loaded.highlighter.getLoadedLanguages().includes(effectiveLang)) {
    return null;
  }
  return toHtml(loaded, code, effectiveLang);
}

const htmlCache = new Map<string, Promise<string>>();

export function highlightCode(code: string, lang: string): Promise<string> {
  const key = `${lang}:${code}`;
  const cached = htmlCache.get(key);
  if (cached) return cached;

  const promise = getHighlighter().then(async ({ shiki, highlighter }) => {
    const known = lang in shiki.bundledLanguages;
    const effectiveLang = known ? (lang as keyof typeof shiki.bundledLanguages) : 'text';
    if (effectiveLang !== 'text' && !highlighter.getLoadedLanguages().includes(effectiveLang)) {
      await highlighter.loadLanguage(effectiveLang);
    }
    return toHtml({ shiki, highlighter }, code, effectiveLang);
  });
  htmlCache.set(key, promise);
  return promise;
}
