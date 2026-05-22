export interface PreviousDumpItem {
  relativeLabel: string;
  summary: string;
  mood?: string;
  focusTitle?: string;
}

export function sanitizePreviousContext(input: unknown): PreviousDumpItem[] {
  if (!Array.isArray(input)) return [];

  return input
    .slice(0, 3)
    .map((item): PreviousDumpItem | null => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      if (typeof row.relativeLabel !== 'string' || typeof row.summary !== 'string') {
        return null;
      }
      const summary = row.summary.trim();
      const relativeLabel = row.relativeLabel.trim();
      if (!summary || !relativeLabel) return null;

      return {
        relativeLabel,
        summary: summary.slice(0, 500),
        mood: typeof row.mood === 'string' ? row.mood.trim() : undefined,
        focusTitle: typeof row.focusTitle === 'string' ? row.focusTitle.trim() : undefined,
      };
    })
    .filter((item): item is PreviousDumpItem => item !== null);
}

export function formatPreviousContextBlock(items: PreviousDumpItem[]): string {
  if (items.length === 0) return '';

  const lines = items.map(item => {
    const extras: string[] = [];
    if (item.mood) extras.push(`mood: ${item.mood}`);
    if (item.focusTitle) extras.push(`focus was ${item.focusTitle}`);
    const suffix = extras.length > 0 ? ` (${extras.join(', ')})` : '';
    return `- ${item.relativeLabel}: ${item.summary}${suffix}`;
  });

  return `Previous context:\n${lines.join('\n')}\n\n`;
}

export function buildProcessUserMessage(
  text: string,
  reference: Date,
  previousContext: PreviousDumpItem[],
): string {
  const todayISO = reference.toISOString().slice(0, 10);
  const weekday = reference.toLocaleDateString('en-US', { weekday: 'long' });
  const contextBlock = formatPreviousContextBlock(previousContext);

  return `Today's date: ${todayISO} (${weekday})\n\n${contextBlock}Today's dump:\n\n${text.trim()}`;
}

export const PREVIOUS_CONTEXT_PROMPT = `
When "Previous context" is provided above today's dump:
- Read it carefully before analyzing today's dump.
- At least one insight MUST connect today to recent patterns (recurring themes, repeated worries, mood shifts, progress). Be specific and human — e.g. "You've mentioned the project deadline several times this week — it still looks like your main source of stress."
- You may reference the timeline (e.g. "3 days ago", "yesterday") naturally in insights or summary when relevant.
- If there is no Previous context section, do not invent past dumps.`;
