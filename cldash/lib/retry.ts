export interface RetryOptions {
  attempts?: number;
  backoff?: number;
  maxBackoff?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: Error;
  attempts: number;
  totalDuration: number;
}

/**
 * Retry operations with exponential backoff
 *
 * Makes agent workflows resilient to flaky operations like network calls,
 * file system race conditions, or eventual consistency. Automatically retries
 * with increasing delays between attempts.
 *
 * @param operation - Async function to retry
 * @param options - Retry configuration (attempts, backoff, maxBackoff)
 * @returns Result of successful attempt or final error
 *
 * @example
 * ```typescript
 * // Simple retry
 * const result = await retry(
 *   () => fetchAPI('https://api.example.com/data'),
 *   { attempts: 3, backoff: 1000 }
 * );
 *
 * // With custom retry logic
 * const result = await retry(
 *   async () => {
 *     const {success} = await exec('npm test');
 *     if (!success) throw new Error('Tests failed');
 *     return success;
 *   },
 *   {
 *     attempts: 5,
 *     backoff: 2000,
 *     onRetry: (attempt, error) => {
 *       console.log(`Attempt ${attempt} failed: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    attempts = 3,
    backoff = 1000,
    maxBackoff = 30000,
    onRetry,
  } = options;

  const startTime = Date.now();
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error as Error;

      if (attempt < attempts) {
        // Calculate exponential backoff with jitter
        const delay = Math.min(
          backoff * Math.pow(2, attempt - 1) + Math.random() * 1000,
          maxBackoff
        );

        if (onRetry) {
          onRetry(attempt, lastError);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new RetryError(
    `Operation failed after ${attempts} attempts`,
    lastError!,
    attempts,
    Date.now() - startTime
  );
}

/**
 * Retry with structured result instead of throwing
 *
 * @param operation - Async function to retry
 * @param options - Retry configuration
 * @returns Structured result with success status, result/error, and metadata
 */
export async function retryWithResult<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  try {
    const result = await retry(operation, options);
    return {
      success: true,
      result,
      attempts: options.attempts || 3,
      totalDuration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error as Error,
      attempts: options.attempts || 3,
      totalDuration: Date.now() - startTime,
    };
  }
}

export class RetryError extends Error {
  public originalError: Error;
  public attempts: number;
  public totalDuration: number;

  constructor(
    message: string,
    originalError: Error,
    attempts: number,
    totalDuration: number
  ) {
    super(message);
    this.name = 'RetryError';
    this.originalError = originalError;
    this.attempts = attempts;
    this.totalDuration = totalDuration;
  }
}
