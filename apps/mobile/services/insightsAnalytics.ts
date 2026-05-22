import { Mood, Task } from './api';
import { DumpEntry } from './storage';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Higher = calmer / more positive energy for the trend line */
export const MOOD_SCORE: Record<Mood, number> = {
  energized: 88,
  focused: 82,
  creative: 78,
  reflective: 68,
  scattered: 52,
  anxious: 38,
  overwhelmed: 28,
  stressed: 22,
};

const STRESS_MOODS: Mood[] = ['overwhelmed', 'stressed', 'anxious'];

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const CATEGORY_LABELS: Record<Task['category'], string> = {
  work: 'Work',
  personal: 'Personal',
  health: 'Health',
  finance: 'Finance',
  creative: 'Creative',
  social: 'Social',
  admin: 'Admin',
};

export interface MoodDayPoint {
  dateKey: string;
  shortLabel: string;
  score: number | null;
  mood: Mood | null;
  dumpCount: number;
}

export interface CategoryStat {
  category: Task['category'];
  label: string;
  count: number;
  percent: number;
}

export interface InsightsSnapshot {
  moodTrend: MoodDayPoint[];
  categories: CategoryStat[];
  totalDumps: number;
  totalTasks: number;
  clarityHours: number;
  clarityMinutes: number;
  patterns: string[];
  dumpsLast7Days: number;
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isWithinLastDays(iso: string, days: number, now: Date): boolean {
  const then = new Date(iso).getTime();
  const cutoff = startOfLocalDay(now).getTime() - (days - 1) * MS_PER_DAY;
  return then >= cutoff;
}

function entriesInWindow(entries: DumpEntry[], days: number): DumpEntry[] {
  const now = new Date();
  return entries.filter(e => isWithinLastDays(e.createdAt, days, now));
}

export function buildMoodTrend(entries: DumpEntry[], days = 7): MoodDayPoint[] {
  const now = new Date();
  const todayStart = startOfLocalDay(now).getTime();
  const points: MoodDayPoint[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const dayStart = new Date(todayStart - offset * MS_PER_DAY);
    const dayEnd = new Date(dayStart.getTime() + MS_PER_DAY);
    const dateKey = dayStart.toISOString().slice(0, 10);
    const shortLabel = dayStart.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);

    const dayEntries = entries.filter(e => {
      const t = new Date(e.createdAt).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    });

    if (dayEntries.length === 0) {
      points.push({ dateKey, shortLabel, score: null, mood: null, dumpCount: 0 });
      continue;
    }

    const avgScore =
      dayEntries.reduce((sum, e) => sum + MOOD_SCORE[e.result.mood], 0) / dayEntries.length;
    const latest = dayEntries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];

    points.push({
      dateKey,
      shortLabel,
      score: Math.round(avgScore),
      mood: latest.result.mood,
      dumpCount: dayEntries.length,
    });
  }

  return points;
}

export function buildCategoryStats(entries: DumpEntry[]): CategoryStat[] {
  const counts = new Map<Task['category'], number>();
  let total = 0;

  for (const entry of entries) {
    for (const task of entry.result.tasks) {
      counts.set(task.category, (counts.get(task.category) ?? 0) + 1);
      total += 1;
    }
  }

  if (total === 0) return [];

  return [...counts.entries()]
    .map(([category, count]) => ({
      category,
      label: CATEGORY_LABELS[category],
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

function formatHours(minutes: number): string {
  if (minutes === 0) return '0h';
  if (minutes < 60) return '<1h';
  const h = minutes / 60;
  if (h < 10) return `${h.toFixed(1)}h`;
  return `${Math.round(h)}h`;
}

function detectOverwhelmDayPattern(entries: DumpEntry[]): string | null {
  if (entries.length < 2) return null;

  const stressByDay = new Array(7).fill(0);
  const dumpsByDay = new Array(7).fill(0);

  for (const entry of entries) {
    const dow = new Date(entry.createdAt).getDay();
    dumpsByDay[dow] += 1;
    if (STRESS_MOODS.includes(entry.result.mood)) {
      stressByDay[dow] += 1;
    }
  }

  const maxStress = Math.max(...stressByDay);
  if (maxStress >= 1 && entries.length >= 2) {
    const dow = stressByDay.indexOf(maxStress);
    const day = DAY_NAMES[dow];
    if (maxStress >= 2) {
      return `You're most overwhelmed on ${day}s — stress showed up in ${maxStress} of your dumps that day.`;
    }
    return `You're most overwhelmed on ${day}s based on your recent dumps.`;
  }

  const maxDumps = Math.max(...dumpsByDay);
  if (maxDumps >= 2 && entries.length >= 3) {
    const dow = dumpsByDay.indexOf(maxDumps);
    return `You dump most often on ${DAY_NAMES[dow]}s — ${maxDumps} entries so far.`;
  }

  return null;
}

function detectCategoryPattern(categories: CategoryStat[]): string | null {
  if (categories.length === 0) return null;
  const top = categories[0];
  if (top.percent >= 45) {
    return `${top.label} tasks dominate your list (${top.percent}% of tasks) — that's where most of your mental load lives.`;
  }
  if (categories.length >= 2 && categories[0].count === categories[1].count) {
    return `${categories[0].label} and ${categories[1].label} are tied for your top task types.`;
  }
  return null;
}

function detectMoodTrendPattern(trend: MoodDayPoint[]): string | null {
  const scored = trend.filter(p => p.score !== null);
  if (scored.length < 3) return null;

  const firstHalf = scored.slice(0, Math.ceil(scored.length / 2));
  const secondHalf = scored.slice(Math.ceil(scored.length / 2));
  const avg = (pts: MoodDayPoint[]) =>
    pts.reduce((s, p) => s + (p.score ?? 0), 0) / pts.length;

  const early = avg(firstHalf);
  const late = avg(secondHalf);
  const delta = late - early;

  if (delta >= 12) {
    return 'Your mood trend is lifting this week — later dumps feel calmer than earlier ones.';
  }
  if (delta <= -12) {
    return 'Stress has been building through the week — consider a lighter day or a reset dump.';
  }
  return null;
}

function detectDominantMood(entries: DumpEntry[]): string | null {
  if (entries.length < 2) return null;
  const counts = new Map<Mood, number>();
  for (const e of entries) {
    counts.set(e.result.mood, (counts.get(e.result.mood) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const [mood, count] = sorted[0];
  if (count >= 2 && count / entries.length >= 0.4) {
    const label = mood.charAt(0).toUpperCase() + mood.slice(1);
    return `"${label}" is your most common mood lately (${count} of ${entries.length} dumps).`;
  }
  return null;
}

export function generatePatterns(
  allEntries: DumpEntry[],
  recentEntries: DumpEntry[],
  moodTrend: MoodDayPoint[],
  categories: CategoryStat[],
): string[] {
  const patterns: string[] = [];

  const overwhelm = detectOverwhelmDayPattern(recentEntries);
  if (overwhelm) patterns.push(overwhelm);

  const category = detectCategoryPattern(categories);
  if (category) patterns.push(category);

  const trend = detectMoodTrendPattern(moodTrend);
  if (trend) patterns.push(trend);

  const dominant = detectDominantMood(recentEntries);
  if (dominant) patterns.push(dominant);

  if (patterns.length === 0 && allEntries.length === 1) {
    patterns.push('Keep dumping — after a few entries, Remi can spot weekly patterns for you.');
  } else if (patterns.length === 0) {
    patterns.push('Your patterns are still forming — a few more dumps will sharpen these insights.');
  }

  return patterns.slice(0, 4);
}

export function computeInsights(entries: DumpEntry[]): InsightsSnapshot {
  const recent = entriesInWindow(entries, 7);
  const moodTrend = buildMoodTrend(entries, 7);
  const categories = buildCategoryStats(recent.length > 0 ? recent : entries);

  const totalTasks = entries.reduce((n, e) => n + e.result.tasks.length, 0);
  const clarityMinutes = entries.reduce(
    (n, e) => n + e.result.tasks.reduce((s, t) => s + (t.estimatedMinutes ?? 0), 0),
    0,
  );

  const patterns = generatePatterns(entries, recent, moodTrend, categories);

  return {
    moodTrend,
    categories,
    totalDumps: entries.length,
    totalTasks,
    clarityHours: clarityMinutes / 60,
    clarityMinutes,
    patterns,
    dumpsLast7Days: recent.length,
  };
}

export function formatClarityDisplay(minutes: number): string {
  return formatHours(minutes);
}
