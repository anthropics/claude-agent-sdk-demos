export interface AssertResult {
  passed: boolean;
  message: string;
  condition?: boolean;
}

/**
 * Verify conditions with structured feedback for agent self-assessment
 *
 * Makes agent verification explicit and structured. Instead of relying on
 * implicit success/failure, agents can programmatically check conditions
 * and receive clear feedback.
 *
 * @param condition - Boolean condition to verify
 * @param message - Description of what's being verified
 * @param throwOnFailure - Whether to throw error on failure (default: true)
 * @returns Structured result with passed status and message
 *
 * @example
 * ```typescript
 * // Throws on failure
 * assert(fileExists('config.json'), 'Config file must exist');
 *
 * // Returns result without throwing
 * const result = assert(tests.passed, 'Tests must pass', false);
 * if (!result.passed) {
 *   console.log('Verification failed:', result.message);
 * }
 * ```
 */
export function assert(
  condition: boolean,
  message: string,
  throwOnFailure: boolean = true
): AssertResult {
  const result: AssertResult = {
    passed: condition,
    message,
    condition,
  };

  if (!condition && throwOnFailure) {
    throw new AssertionError(message, result);
  }

  return result;
}

export class AssertionError extends Error {
  public result: AssertResult;

  constructor(message: string, result: AssertResult) {
    super(message);
    this.name = 'AssertionError';
    this.result = result;
  }
}

/**
 * Verify multiple conditions and return all results
 *
 * @param checks - Array of [condition, message] tuples
 * @returns Array of assertion results
 *
 * @example
 * ```typescript
 * const results = assertAll([
 *   [fileExists('src/index.ts'), 'Entry point must exist'],
 *   [tests.passed, 'Tests must pass'],
 *   [linter.errors.length === 0, 'No linting errors']
 * ]);
 *
 * const allPassed = results.every(r => r.passed);
 * ```
 */
export function assertAll(
  checks: Array<[boolean, string]>
): AssertResult[] {
  return checks.map(([condition, message]) =>
    assert(condition, message, false)
  );
}
