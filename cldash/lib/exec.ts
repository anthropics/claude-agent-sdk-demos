import { exec as nodeExec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(nodeExec);

export interface ExecOptions {
  cwd?: string;
  timeout?: number;
  maxBuffer?: number;
  dryRun?: boolean;
  onData?: (data: string, stream: 'stdout' | 'stderr') => void;
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  success: boolean;
  command: string;
  dryRun?: boolean;
}

/**
 * Enhanced command execution with structured output
 *
 * Wraps bash commands to return structured results that agents can
 * easily parse and act on. Unlike raw exec, provides timeout handling,
 * duration tracking, and consistent error capture.
 *
 * @param command - Shell command to execute
 * @param options - Execution options (cwd, timeout, maxBuffer, dryRun, onData)
 * @returns Structured result with stdout, stderr, exitCode, duration, success
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await exec('npm test', { timeout: 30000 });
 * if (result.success) {
 *   console.log('Tests passed!', result.stdout);
 * } else {
 *   console.error('Tests failed:', result.stderr);
 * }
 *
 * // Dry run mode
 * const preview = await exec('rm -rf important/', { dryRun: true });
 * console.log('Would execute:', preview.command);
 *
 * // Progress tracking
 * await exec('npm install', {
 *   onData: (data, stream) => {
 *     if (stream === 'stdout') console.log('Progress:', data);
 *   }
 * });
 * ```
 */
export async function exec(
  command: string,
  options: ExecOptions = {}
): Promise<ExecResult> {
  const startTime = Date.now();

  // Dry run mode - don't execute, just return what would happen
  if (options.dryRun) {
    return {
      stdout: '',
      stderr: '',
      exitCode: 0,
      duration: 0,
      success: true,
      command,
      dryRun: true,
    };
  }

  // If onData callback provided, use spawn for streaming
  if (options.onData) {
    return execWithStreaming(command, options);
  }

  // Default: use promisified exec (buffered)
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

/**
 * Execute with streaming support for progress tracking
 */
async function execWithStreaming(
  command: string,
  options: ExecOptions
): Promise<ExecResult> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    const child = spawn(command, [], {
      shell: true,
      cwd: options.cwd || process.cwd(),
    });

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    // Collect and stream stdout
    child.stdout?.on('data', (data: Buffer) => {
      const str = data.toString();
      stdout += str;
      if (options.onData) {
        options.onData(str, 'stdout');
      }
    });

    // Collect and stream stderr
    child.stderr?.on('data', (data: Buffer) => {
      const str = data.toString();
      stderr += str;
      if (options.onData) {
        options.onData(str, 'stderr');
      }
    });

    // Handle timeout
    let timeoutId: NodeJS.Timeout | undefined;
    if (options.timeout) {
      timeoutId = setTimeout(() => {
        child.kill();
      }, options.timeout);
    }

    // Handle completion
    child.on('close', (code) => {
      if (timeoutId) clearTimeout(timeoutId);

      exitCode = code || 0;
      const duration = Date.now() - startTime;

      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode,
        duration,
        success: exitCode === 0,
        command,
      });
    });

    // Handle errors
    child.on('error', (error) => {
      if (timeoutId) clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      resolve({
        stdout: stdout.trim(),
        stderr: error.message,
        exitCode: 1,
        duration,
        success: false,
        command,
      });
    });
  });
}
