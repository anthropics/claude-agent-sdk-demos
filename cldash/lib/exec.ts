import { exec as nodeExec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(nodeExec);

export interface ExecOptions {
  cwd?: string;
  timeout?: number;
  maxBuffer?: number;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  success: boolean;
  command: string;
}

/**
 * Enhanced command execution with structured output
 *
 * Wraps bash commands to return structured results that agents can
 * easily parse and act on. Unlike raw exec, provides timeout handling,
 * duration tracking, and consistent error capture.
 *
 * @param command - Shell command to execute
 * @param options - Execution options (cwd, timeout, maxBuffer)
 * @returns Structured result with stdout, stderr, exitCode, duration, success
 *
 * @example
 * ```typescript
 * const result = await exec('npm test', { timeout: 30000 });
 * if (result.success) {
 *   console.log('Tests passed!', result.stdout);
 * } else {
 *   console.error('Tests failed:', result.stderr);
 * }
 * ```
 */
export async function exec(
  command: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  const startTime = Date.now();
  const opts = {
    timeout: options.timeout || 120000, // 2 minutes default
    maxBuffer: options.maxBuffer || 1024 * 1024 * 10, // 10MB default
    cwd: options.cwd || process.cwd(),
  };

  try {
    const { stdout, stderr } = await execAsync(command, opts);
    const duration = Date.now() - startTime;

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exitCode: 0,
      duration,
      success: true,
      command,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    return {
      stdout: error.stdout?.trim() || '',
      stderr: error.stderr?.trim() || error.message || '',
      exitCode: error.code || 1,
      duration,
      success: false,
      command,
    };
  }
}
