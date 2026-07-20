/**
 * File path → shiki language id, copied from the user's gitbase app
 * (reference/gitbase code-file-view). Unknown extensions fall back to "text"
 * (rendered unhighlighted).
 */

// prettier-ignore
const EXT_TO_LANG: Record<string, string> = {
  ts: 'typescript', mts: 'typescript', cts: 'typescript', tsx: 'tsx',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'jsx',
  json: 'json', jsonc: 'json', json5: 'json',
  md: 'markdown', mdx: 'mdx',
  html: 'html', htm: 'html', xhtml: 'html', svg: 'html', xml: 'xml',
  css: 'css', scss: 'scss', sass: 'sass', less: 'less',
  py: 'python', pyi: 'python', pyw: 'python',
  rs: 'rust', go: 'go', rb: 'ruby', erb: 'ruby', java: 'java',
  c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', hxx: 'cpp',
  cs: 'csharp', swift: 'swift', kt: 'kotlin', kts: 'kotlin',
  sql: 'sql', graphql: 'graphql', gql: 'graphql',
  yml: 'yaml', yaml: 'yaml', toml: 'toml',
  ini: 'ini', cfg: 'ini', conf: 'ini',
  env: 'bash', sh: 'bash', bash: 'bash', zsh: 'bash', fish: 'bash',
  dockerfile: 'dockerfile', diff: 'diff', patch: 'diff', php: 'php',
};

const NAME_TO_LANG: Record<string, string> = {
  dockerfile: 'dockerfile',
  makefile: 'bash',
  gemfile: 'ruby',
  '.gitignore': 'bash',
  '.gitattributes': 'bash',
  '.dockerignore': 'bash',
  '.editorconfig': 'ini',
  '.env': 'bash',
  '.env.local': 'bash',
  '.env.example': 'bash',
  'nginx.conf': 'nginx',
};

export function detectLang(path: string): string {
  const name = path.split('/').pop() ?? '';
  const lower = name.toLowerCase();
  const nameMatch = NAME_TO_LANG[lower];
  if (nameMatch) return nameMatch;
  const ext = lower.split('.').pop() ?? '';
  return EXT_TO_LANG[ext] ?? 'text';
}
