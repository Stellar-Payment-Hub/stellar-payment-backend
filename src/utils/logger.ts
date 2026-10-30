export interface LogPayload {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  timestamp?: string;
}

export class Logger {
  public log(payload: LogPayload): void {
    const entry = {
      timestamp: new Date().toISOString(),
      ...payload,
    };
    if (payload.level === 'error') {
      console.error(JSON.stringify(entry));
    } else if (payload.level === 'warn') {
      console.warn(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  public info(message: string, context?: Record<string, unknown>): void {
    this.log({ level: 'info', message, context });
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    this.log({ level: 'warn', message, context });
  }

  public error(message: string, context?: Record<string, unknown>): void {
    this.log({ level: 'error', message, context });
  }
}

export const logger = new Logger();
