let pendingTranscript: string | null = null;

export function setPendingTranscript(text: string) {
  pendingTranscript = text;
}

export function consumePendingTranscript(): string | null {
  const text = pendingTranscript;
  pendingTranscript = null;
  return text;
}
