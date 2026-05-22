/** Shared task metadata types and implicit parsing from conversational text. */

export const ACTION_TYPES = [
  'email',
  'call',
  'meet',
  'buy',
  'review',
  'submit',
  'plan',
  'remind',
  'write',
  'schedule',
  'other',
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export interface ParsedTask {
  id: string;
  title: string;
  category: string;
  priority: string;
  estimatedMinutes: number;
  notes: string | null;
  dueDate?: string | null;
  dueLabel?: string | null;
  project?: string | null;
  actionType?: string | null;
  actionVerb?: string | null;
}

export interface ProcessedDumpPayload {
  summary: string;
  mood: string;
  focusItem: { title: string; reason: string };
  tasks: ParsedTask[];
  insights: string[];
}

const ACTION_PATTERNS: { type: ActionType; patterns: RegExp[] }[] = [
  { type: 'email', patterns: [/\b(e-?mail|email)\b/i, /\breach out to\b/i] },
  { type: 'call', patterns: [/\bcall(?:ing)?\b/i, /\bphone\b/i, /\bring\b/i] },
  { type: 'meet', patterns: [/\bmeet(?:ing)?\b/i, /\bcoffee with\b/i, /\bsync with\b/i] },
  { type: 'buy', patterns: [/\bbuy\b/i, /\bpick up\b/i, /\bget groceries\b/i, /\bshop\b/i] },
  { type: 'review', patterns: [/\breview\b/i, /\bread through\b/i, /\blook over\b/i] },
  { type: 'submit', patterns: [/\bsubmit\b/i, /\bfile\b/i, /\bsend (?:the|in)\b/i] },
  { type: 'schedule', patterns: [/\bschedule\b/i, /\bbook\b/i, /\bset up\b/i] },
  { type: 'plan', patterns: [/\bplan\b/i, /\boutline\b/i, /\bmap out\b/i] },
  { type: 'remind', patterns: [/\bremind(?: me)?\b/i, /\bdon'?t forget\b/i] },
  { type: 'write', patterns: [/\bwrite\b/i, /\bdraft\b/i, /\bcompose\b/i] },
];

const PROJECT_PATTERNS: { project: string; patterns: RegExp[] }[] = [
  { project: 'Finance', patterns: [/\bbudget\b/i, /\bfinance\b/i, /\binvoice\b/i, /\bexpense\b/i, /\bq[1-4]\b/i] },
  { project: 'Health', patterns: [/\bdoctor\b/i, /\bworkout\b/i, /\bgym\b/i, /\btherapy\b/i] },
  { project: 'Home', patterns: [/\bgroceries\b/i, /\bclean(?:ing)?\b/i, /\bchores\b/i] },
  { project: 'Work', patterns: [/\breport\b/i, /\bdeadline\b/i, /\bclient\b/i, /\bproject\b/i] },
];

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function nextWeekday(base: Date, targetDay: number): Date {
  const d = new Date(base);
  const diff = (targetDay - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

export function parseDueFromText(
  text: string,
  reference: Date = new Date(),
): { dueDate: string; dueLabel: string } | null {
  const lower = text.toLowerCase();

  if (/\btoday\b|\btonight\b|\bthis evening\b|\beod\b/.test(lower)) {
    return { dueDate: toISODate(reference), dueLabel: 'Today' };
  }
  if (/\btomorrow\b/.test(lower)) {
    const d = addDays(reference, 1);
    return { dueDate: toISODate(d), dueLabel: 'Tomorrow' };
  }
  if (/\bday after tomorrow\b/.test(lower)) {
    const d = addDays(reference, 2);
    return { dueDate: toISODate(d), dueLabel: 'Day after tomorrow' };
  }
  if (/\bnext week\b/.test(lower)) {
    const d = addDays(reference, 7);
    return { dueDate: toISODate(d), dueLabel: 'Next week' };
  }
  if (/\bthis week\b|\bby friday\b|\bend of week\b/.test(lower)) {
    const d = nextWeekday(reference, 5);
    return { dueDate: toISODate(d), dueLabel: 'This week' };
  }

  const inDays = lower.match(/\bin (\d+) days?\b/);
  if (inDays) {
    const n = parseInt(inDays[1], 10);
    const d = addDays(reference, n);
    return { dueDate: toISODate(d), dueLabel: `In ${n} days` };
  }

  for (const [name, dayNum] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`\\b(?:next )?${name}\\b`).test(lower)) {
      const d = nextWeekday(reference, dayNum);
      const label = lower.includes('next') ? `Next ${name.charAt(0).toUpperCase() + name.slice(1)}` : name.charAt(0).toUpperCase() + name.slice(1);
      return { dueDate: toISODate(d), dueLabel: label };
    }
  }

  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) {
    return { dueDate: `${iso[1]}-${iso[2]}-${iso[3]}`, dueLabel: `${iso[2]}/${iso[3]}` };
  }

  return null;
}

export function inferActionType(text: string): { actionType: ActionType; actionVerb: string | null } {
  for (const { type, patterns } of ACTION_PATTERNS) {
    for (const p of patterns) {
      const m = text.match(p);
      if (m) {
        return { actionType: type, actionVerb: m[0].toLowerCase() };
      }
    }
  }
  return { actionType: 'other', actionVerb: null };
}

export function inferProject(text: string): string | null {
  const tag = text.match(/#([\w-]+)/);
  if (tag) {
    return tag[1].charAt(0).toUpperCase() + tag[1].slice(1);
  }

  const about = text.match(/\babout (?:the )?([\w\s]{2,30}?)(?:\.|,|$|\bfor\b)/i);
  if (about) {
    const topic = about[1].trim();
    if (/budget|finance/i.test(topic)) return 'Finance';
    if (topic.length <= 24) return topic.charAt(0).toUpperCase() + topic.slice(1);
  }

  for (const { project, patterns } of PROJECT_PATTERNS) {
    if (patterns.some(p => p.test(text))) return project;
  }

  return null;
}

function normalizeActionType(value: string | null | undefined): ActionType {
  if (value && ACTION_TYPES.includes(value as ActionType)) {
    return value as ActionType;
  }
  return 'other';
}

function isValidISODate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

/** Enrich a single task using its fields plus the full brain-dump context. */
export function enrichTask(task: ParsedTask, dumpText: string, reference: Date): ParsedTask {
  const context = [dumpText, task.title, task.notes ?? ''].join(' ');

  let dueDate = task.dueDate ?? null;
  let dueLabel = task.dueLabel ?? null;
  if (!dueDate || !isValidISODate(dueDate)) {
    const parsed = parseDueFromText(context, reference);
    if (parsed) {
      dueDate = parsed.dueDate;
      dueLabel = parsed.dueLabel;
    }
  } else if (!dueLabel) {
    dueLabel = dueDate;
  }

  let actionType = normalizeActionType(task.actionType ?? undefined);
  let actionVerb = task.actionVerb ?? null;
  if (actionType === 'other') {
    const inferred = inferActionType(context);
    actionType = inferred.actionType;
    actionVerb = actionVerb ?? inferred.actionVerb;
  }

  let project = task.project?.trim() || null;
  if (!project) {
    project = inferProject(context);
  }

  return {
    ...task,
    dueDate,
    dueLabel,
    project,
    actionType,
    actionVerb,
  };
}

/** Normalize and enrich all tasks in a processed dump. */
export function enrichProcessedDump(
  data: ProcessedDumpPayload,
  dumpText: string,
  reference: Date = new Date(),
): ProcessedDumpPayload {
  return {
    ...data,
    tasks: data.tasks.map(t => enrichTask(t, dumpText, reference)),
  };
}

export const PROCESS_SYSTEM_PROMPT_EXTENSION = `
Implicit meta-parsing (REQUIRED for every task):
- Parse conversational cues for due dates ("tomorrow", "next Monday", "by Friday", "remind me tonight") into dueDate (YYYY-MM-DD) and dueLabel (short human phrase).
- Use today's date from the user message when resolving relative dates.
- Infer project/context tags (e.g. "about budget" → project: "Finance", "#marketing" → "Marketing").
- Infer actionType from verbs: email | call | meet | buy | review | submit | plan | remind | write | schedule | other.
- Set actionVerb to the triggering word/phrase when found (e.g. "email", "remind").
- Title should stay clean and actionable; put extra context in notes when helpful.

Each task object must include these fields:
{
  "id": "unique-id",
  "title": "Email Sarah about budget",
  "category": "finance",
  "priority": "high",
  "estimatedMinutes": 15,
  "notes": null,
  "dueDate": "2026-05-21",
  "dueLabel": "Tomorrow",
  "project": "Finance",
  "actionType": "email",
  "actionVerb": "email"
}
`;
