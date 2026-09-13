/**
 * Lazy shiki highlighting for the file viewer, adapted from gitbase's
 * markdown highlighter: the shiki module (plus its wasm engine and grammar
 * chunks) is only dynamically imported once a viewer actually highlights
 * something, so none of it lands in the main bundle. Singleton highlighter,
 * grammars loaded on demand, and a per-(lang, code) promise cache so React's
 * `use()` can suspend on a stable promise.
 */

type Highlighter = Awaited<ReturnType<(typeof import('shiki/core'))['createHighlighterCore']>>;
type BundledLanguages = (typeof import('shiki/langs'))['bundledLanguages'];
type Loaded = { highlighter: Highlighter; bundledLanguages: BundledLanguages };

/** Dark theme; its #0d1117 background is swapped for transparent below so the
 * viewer's own bg-menu surface shows through. */
const THEME = 'github-dark-default';

let singleton: Promise<Loaded> | null = null;
let loaded: Loaded | null = null;

function getHighlighter(): Promise<Loaded> {
  // shiki/core keeps only the engine in this dynamic chunk; the theme, the grammar
  // map, and the wasm engine load alongside it, and grammars themselves stay lazy.
  singleton ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/oniguruma'),
    import('shiki/langs'),
    import('shiki/themes'),
  ]).then(async ([core, oniguruma, langs, themes]) => {
    // Load the one theme through shiki's own `themes` subpath (not the
    // `@shikijs/themes` package, which is only a transitive dep and so is
    // unresolvable under a strict, non-hoisted node_modules layout).
    const theme = await themes.bundledThemes[THEME]();
    loaded = {
      highlighter: await core.createHighlighterCore({
        themes: [theme.default],
        langs: [],
        engine: oniguruma.createOnigurumaEngine(import('shiki/wasm')),
      }),
      bundledLanguages: langs.bundledLanguages,
    };
    return loaded;
  });
  return singleton;
}

function toHtml(highlighter: Highlighter, code: string, lang: string) {
  return highlighter.codeToHtml(code, {
    lang,
    theme: THEME,
    colorReplacements: { '#0d1117': 'transparent' },
  });
}

/** Re-highlight immediately while typing once the file's grammar is loaded. */
export function highlightCodeSync(code: string, lang: string): string | null {
  if (!loaded) return null;
  const effectiveLang = lang in loaded.bundledLanguages ? lang : 'text';
  if (effectiveLang !== 'text' && !loaded.highlighter.getLoadedLanguages().includes(effectiveLang)) {
    return null;
  }
  return toHtml(loaded.highlighter, code, effectiveLang);
}

const htmlCache = new Map<string, Promise<string>>();

export function highlightCode(code: string, lang: string): Promise<string> {
  const key = `${lang}:${code}`;
  const cached = htmlCache.get(key);
  if (cached) return cached;

  const promise = getHighlighter().then(async ({ highlighter, bundledLanguages }) => {
    const known = lang in bundledLanguages;
    const effectiveLang = known ? (lang as keyof BundledLanguages) : 'text';
    if (effectiveLang !== 'text' && !highlighter.getLoadedLanguages().includes(effectiveLang)) {
      await highlighter.loadLanguage(bundledLanguages[effectiveLang]);
    }
    return toHtml(highlighter, code, effectiveLang);
  });
  htmlCache.set(key, promise);
  return promise;
}
