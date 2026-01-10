/**
 * Compose functions into a pipeline (left-to-right execution)
 *
 * Embodies Unix philosophy: small, focused functions that chain together.
 * Instead of nested function calls, create readable pipelines where data
 * flows through transformations.
 *
 * @param fns - Functions to compose (executed left to right)
 * @returns New function that applies all transformations in sequence
 *
 * @example
 * ```typescript
 * // Without pipe - nested and hard to read
 * const result = await writeFile(
 *   format(
 *     validate(
 *       await readFile('data.json')
 *     )
 *   )
 * );
 *
 * // With pipe - clear data flow
 * const processData = pipe(
 *   readFile,
 *   validate,
 *   format,
 *   writeFile
 * );
 * const result = await processData('data.json');
 * ```
 */
export function pipe<T>(...fns: Array<(arg: any) => any>): (input: T) => any {
  return (input: T) => {
    return fns.reduce((value, fn) => {
      if (value instanceof Promise) {
        return value.then(fn);
      }
      return fn(value);
    }, input as any);
  };
}

/**
 * Compose async functions into a pipeline
 *
 * @param fns - Async functions to compose
 * @returns Async function that applies all transformations
 *
 * @example
 * ```typescript
 * const workflow = pipeAsync(
 *   async (file) => exec(`cat ${file}`),
 *   async (result) => result.stdout,
 *   async (content) => content.toUpperCase(),
 *   async (upper) => exec(`echo "${upper}" > output.txt`)
 * );
 *
 * await workflow('input.txt');
 * ```
 */
export function pipeAsync<T>(
  ...fns: Array<(arg: any) => Promise<any>>
): (input: T) => Promise<any> {
  return async (input: T) => {
    let value: any = input;
    for (const fn of fns) {
      value = await fn(value);
    }
    return value;
  };
}

/**
 * Create a pipeline that logs each step for debugging
 *
 * @param fns - Functions to compose with logging
 * @returns Pipeline that logs input/output at each step
 */
export function pipeDebug<T>(
  ...fns: Array<(arg: any) => any>
): (input: T) => any {
  return (input: T) => {
    console.log('[PIPE] Initial input:', input);

    return fns.reduce((value, fn, index) => {
      const result =
        value instanceof Promise
          ? value.then((v) => {
              console.log(`[PIPE] Step ${index} input:`, v);
              const output = fn(v);
              if (output instanceof Promise) {
                return output.then((o) => {
                  console.log(`[PIPE] Step ${index} output:`, o);
                  return o;
                });
              }
              console.log(`[PIPE] Step ${index} output:`, output);
              return output;
            })
          : (() => {
              console.log(`[PIPE] Step ${index} input:`, value);
              const output = fn(value);
              console.log(`[PIPE] Step ${index} output:`, output);
              return output;
            })();

      return result;
    }, input as any);
  };
}
