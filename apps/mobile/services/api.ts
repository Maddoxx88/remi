import { API_BASE_URL } from './config';

export interface Task {
  id: string;
  title: string;
  category: 'work' | 'personal' | 'health' | 'finance' | 'creative' | 'social' | 'admin';
  priority: 'high' | 'medium' | 'low';
  estimatedMinutes: number;
  notes: string | null;
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

export async function processDump(text: string): Promise<ProcessResponse> {
  const response = await fetch(`${API_BASE_URL}/api/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process dump');
  }

  return response.json();
}
