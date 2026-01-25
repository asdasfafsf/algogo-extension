export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function createError(code: string, message: string, details?: unknown): AppError {
  return new AppError(code, message, details);
}

export async function waitUntil<T>(
  condition: () => T | Promise<T>,
  options: {
    interval?: number;
    timeout?: number;
    timeoutMessage?: string;
  } = {}
): Promise<T> {
  const {
    interval = 100,
    timeout = 30000,
    timeoutMessage = 'Operation timed out'
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const result = await condition();
      if (result !== undefined && result !== null) {
        return result;
      }
    } catch {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  throw createError('TIMEOUT', timeoutMessage);
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeout: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(createError('TIMEOUT', timeoutMessage)), timeout)
    )
  ]);
}
