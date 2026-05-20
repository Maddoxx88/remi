import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProcessedDump } from './api';

const HISTORY_KEY = 'remi_history';
const MAX_HISTORY = 50;

export interface DumpEntry {
  id: string;
  rawText: string;
  result: ProcessedDump;
  createdAt: string;
}

export async function saveToHistory(rawText: string, result: ProcessedDump): Promise<DumpEntry> {
  const entry: DumpEntry = {
    id: Date.now().toString(),
    rawText,
    result,
    createdAt: new Date().toISOString(),
  };

  const existing = await getHistory();
  const updated = [entry, ...existing].slice(0, MAX_HISTORY);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return entry;
}

export async function getHistory(): Promise<DumpEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteEntry(id: string): Promise<void> {
  const existing = await getHistory();
  const updated = existing.filter((e) => e.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
