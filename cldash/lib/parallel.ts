export interface ParallelOptions {
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
  stopOnError?: boolean;
}

export interface ParallelResult<T> {
  results: Array<T | Error>;
  successful: number;
  failed: number;
  duration: number;
}

/**
 * Execute tasks in parallel with concurrency control
 *
 * Unlike Promise.all(), this allows you to limit concurrent executions.
 * Critical for batch operations that could overwhelm resources (file handles,
 * network connections, memory).
 *
 * @param tasks - Array of async functions to execute
 * @param options - Concurrency limit, progress callback, error handling
 * @returns Results array (successful values or errors)
 *
 * @example
 * ```typescript
 * // Migrate 100 files but only 5 at a time
 * const tasks = files.map(file => () => migrateFile(file));
 * const result = await parallel(tasks, {
 *   concurrency: 5,
 *   onProgress: (done, total) => {
 *     console.log(`Progress: ${done}/${total}`);
 *   }
 * });
 *
 * console.log(`${result.successful} succeeded, ${result.failed} failed`);
 * ```
 */
export async function parallel<T>(
  tasks: Array<() => Promise<T>>,
  options: ParallelOptions = {}
): Promise<ParallelResult<T>> {
  const {
    concurrency = 10,
    onProgress,
    stopOnError = false,
  } = options;

  const startTime = Date.now();
  const results: Array<T | Error> = new Array(tasks.length);
  let completed = 0;
  let successful = 0;
  let failed = 0;
  let index = 0;

  // Execute task at given index
  const executeTask = async (taskIndex: number): Promise<void> => {
    try {
      const result = await tasks[taskIndex]();
      results[taskIndex] = result;
      successful++;
    } catch (error) {
      results[taskIndex] = error as Error;
      failed++;

      if (stopOnError) {
        throw error;
      }
    } finally {
      completed++;
      if (onProgress) {
        onProgress(completed, tasks.length);
      }
    }
  };

  // Worker function that processes tasks from the queue
  const worker = async (): Promise<void> => {
    while (index < tasks.length) {
      const currentIndex = index++;
      await executeTask(currentIndex);
    }
  };

  // Start workers up to concurrency limit
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, tasks.length); i++) {
    workers.push(worker());
  }

  // Wait for all workers to complete
  try {
    await Promise.all(workers);
  } catch (error) {
    // If stopOnError=true, error was thrown
    // Otherwise, errors are in results array
  }

  return {
    results,
    successful,
    failed,
    duration: Date.now() - startTime,
  };
}

/**
 * Execute tasks in parallel with retry for each task
 *
 * Combines parallel execution with automatic retry logic.
 *
 * @param tasks - Array of async functions
 * @param options - Parallel and retry options
 * @returns Results with retry metadata
 *
 * @example
 * ```typescript
 * const result = await parallelWithRetry(
 *   files.map(f => () => processFile(f)),
 *   {
 *     concurrency: 5,
 *     attempts: 3,
 *     backoff: 1000
 *   }
 * );
 * ```
 */
export async function parallelWithRetry<T>(
  tasks: Array<() => Promise<T>>,
  options: ParallelOptions & {
    attempts?: number;
    backoff?: number;
  } = {}
): Promise<ParallelResult<T>> {
  const { attempts = 3, backoff = 1000, ...parallelOptions } = options;

  // Wrap each task with retry logic
  const { retry } = await import('./retry');
  const tasksWithRetry = tasks.map((task) => () =>
    retry(task, { attempts, backoff })
  );

  return parallel(tasksWithRetry, parallelOptions);
}

/**
 * Map over array with parallel execution and concurrency control
 *
 * Like Array.map() but async and with concurrency limits.
 *
 * @param items - Array of items to process
 * @param fn - Async function to apply to each item
 * @param options - Concurrency options
 * @returns Array of results
 *
 * @example
 * ```typescript
 * const migrated = await parallelMap(
 *   files,
 *   async (file) => await migrateFile(file),
 *   { concurrency: 5 }
 * );
 * ```
 */
export async function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options: ParallelOptions = {}
): Promise<ParallelResult<R>> {
  const tasks = items.map((item, index) => () => fn(item, index));
  return parallel(tasks, options);
}

/**
 * Filter array in parallel with concurrency control
 *
 * Like Array.filter() but async and with concurrency limits.
 *
 * @param items - Array of items
 * @param predicate - Async filter function
 * @param options - Concurrency options
 * @returns Filtered array
 *
 * @example
 * ```typescript
 * const validFiles = await parallelFilter(
 *   files,
 *   async (file) => await fileExists(file),
 *   { concurrency: 10 }
 * );
 * ```
 */
export async function parallelFilter<T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
  options: ParallelOptions = {}
): Promise<T[]> {
  const result = await parallelMap(items, predicate, options);

  return items.filter((_, index) => {
    const predicateResult = result.results[index];
    return !(predicateResult instanceof Error) && predicateResult === true;
  });
}
