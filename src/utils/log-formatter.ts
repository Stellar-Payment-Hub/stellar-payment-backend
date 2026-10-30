const SECRET_KEY_REGEX = /S[A-Z0-9]{55}/g;

export function redactSensitiveData(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text.replace(SECRET_KEY_REGEX, '[REDACTED_STELLAR_SECRET]');
}

export function formatLogEntry(level: string, message: string, meta?: Record<string, any>): string {
  const sanitizedMessage = redactSensitiveData(message);
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message: sanitizedMessage,
    ...(meta ? { meta } : {}),
  };
  return JSON.stringify(entry);
}
