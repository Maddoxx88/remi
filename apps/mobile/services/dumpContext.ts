import { DumpEntry } from './storage';

export interface PreviousDumpContext {
  relativeLabel: string;
  summary: string;
  mood: string;
  focusTitle: string;
}

function formatRelativeLabel(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThen = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const diffDays = Math.round(
    (startOfToday.getTime() - startOfThen.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return 'Earlier today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Last N history entries as context for the process API (newest first). */
export function buildPreviousContext(
  history: DumpEntry[],
  limit = 3,
): PreviousDumpContext[] {
  return history.slice(0, limit).map(entry => ({
    relativeLabel: formatRelativeLabel(entry.createdAt),
    summary: entry.result.summary,
    mood: entry.result.mood,
    focusTitle: entry.result.focusItem.title,
  }));
}
