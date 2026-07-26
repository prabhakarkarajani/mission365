/**
 * Structured logging for AI vendor calls. Deliberately never logs prompt or
 * response content - that's user personal data flowing through a
 * third-party vendor already; it shouldn't also sit in application logs by
 * default. Only metadata about the call itself.
 */
export interface AICallLogEntry {
  provider: string;
  operation: string;
  attempt: number;
  latencyMs: number;
  outcome: 'success' | 'failure';
  errorClass?: string;
}

export function logAICall(entry: AICallLogEntry): void {
  const line = `[ai] provider=${entry.provider} op=${entry.operation} attempt=${entry.attempt} latencyMs=${entry.latencyMs} outcome=${entry.outcome}${
    entry.errorClass ? ` errorClass=${entry.errorClass}` : ''
  }`;
  if (entry.outcome === 'failure') {
    console.error(line);
  } else {
    console.log(line);
  }
}
