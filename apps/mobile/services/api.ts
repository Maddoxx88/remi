import { API_BASE_URL } from './config';
import type { PreviousDumpContext } from './dumpContext';

export type ActionType =
  | 'email'
  | 'call'
  | 'meet'
  | 'buy'
  | 'review'
  | 'submit'
  | 'plan'
  | 'remind'
  | 'write'
  | 'schedule'
  | 'other';

export interface Task {
  id: string;
  title: string;
  category: 'work' | 'personal' | 'health' | 'finance' | 'creative' | 'social' | 'admin';
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  notes: string | null;
  dueDate?: string | null;
  dueLabel?: string | null;
  project?: string | null;
  actionType?: ActionType;
  actionVerb?: string | null;
}

export interface FocusItem {
  title: string;
  reason: string;
}

export type Mood =
  | 'focused'
  | 'overwhelmed'
  | 'anxious'
  | 'energized'
  | 'scattered'
  | 'reflective'
  | 'stressed'
  | 'creative';

export interface ProcessedDump {
  summary: string;
  mood: Mood;
  focusItem: FocusItem;
  tasks: Task[];
  insights: string[];
}

export interface ProcessResponse {
  success: boolean;
  data: ProcessedDump;
  processedAt: string;
}

export type { PreviousDumpContext } from './dumpContext';

const PROCESS_TIMEOUT_MS = 90_000;

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.error === 'string') return body.error;
    if (body.error?.message) return body.error.message;
    return `Server error (${response.status})`;
  } catch {
    return `Server error (${response.status})`;
  }
}

export async function processDump(
  text: string,
  previousContext: PreviousDumpContext[] = [],
): Promise<ProcessResponse> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Please enter some text first.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROCESS_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: trimmed,
        previousContext: previousContext.slice(0, 3),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return response.json();
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        `Request timed out. Check the backend is running at ${API_BASE_URL}`,
      );
    }
    if (err instanceof TypeError) {
      throw new Error(
        `Cannot reach Remi server at ${API_BASE_URL}. Start the backend with: npm run dev`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
