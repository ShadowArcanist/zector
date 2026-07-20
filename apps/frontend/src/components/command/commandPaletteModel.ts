export type SearchableCommand = {
  id: string;
  label: string;
  keywords?: string;
};

export function filterCommands<T extends SearchableCommand>(commands: T[], query: string): T[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return commands;
  const words = normalized.split(/\s+/);
  return commands
    .map((command, index) => {
      const label = command.label.toLowerCase();
      const keywords = command.keywords?.toLowerCase() ?? '';
      const haystack = `${label} ${keywords}`;
      if (!words.every((word) => haystack.includes(word))) return null;
      const score = label.startsWith(normalized) ? 0 : label.includes(normalized) ? 1 : 2;
      return { command, index, score };
    })
    .filter((result): result is { command: T; index: number; score: number } => result !== null)
    .sort((a, b) => a.score - b.score || a.index - b.index)
    .map((result) => result.command);
}

export function nextCommandIndex(current: number, direction: number, count: number): number {
  if (count === 0) return 0;
  return (current + direction + count) % count;
}
