export interface TransactionStep<T = any> {
  execute: () => Promise<T>;
  rollback: () => Promise<void>;
  description?: string;
}

export interface TransactionOptions {
  onStepComplete?: (step: number, total: number, description?: string) => void;
  onRollback?: (step: number, description?: string) => void;
}

export interface TransactionResult<T = any> {
  success: boolean;
  results: T[];
  completedSteps: number;
  rolledBack: boolean;
  error?: Error;
  duration: number;
}

/**
 * Execute operations atomically with automatic rollback on failure
 *
 * Like database transactions for file/command operations. If any step fails,
 * all previous steps are automatically rolled back in reverse order.
 *
 * Critical for multi-step operations where partial completion is worse than
 * no completion (git operations, file migrations, deployments).
 *
 * @param steps - Array of {execute, rollback} pairs
 * @param options - Progress callbacks
 * @returns Transaction result with rollback status
 *
 * @example
 * ```typescript
 * const result = await transaction([
 *   {
 *     execute: () => exec('git add .'),
 *     rollback: () => exec('git reset'),
 *     description: 'Stage changes'
 *   },
 *   {
 *     execute: () => exec('git commit -m "changes"'),
 *     rollback: () => exec('git reset HEAD~1'),
 *     description: 'Commit changes'
 *   },
 *   {
 *     execute: () => exec('npm test'),
 *     rollback: () => Promise.resolve(), // Tests don't need rollback
 *     description: 'Run tests'
 *   },
 *   {
 *     execute: () => exec('git push'),
 *     rollback: () => exec('git reset --hard HEAD~1 && git push -f'),
 *     description: 'Push to remote'
 *   }
 * ]);
 *
 * if (!result.success) {
 *   console.log('Transaction failed and was rolled back');
 * }
 * ```
 */
export async function transaction<T = any>(
  steps: TransactionStep<T>[],
  options: TransactionOptions = {}
): Promise<TransactionResult<T>> {
  const { onStepComplete, onRollback } = options;
  const startTime = Date.now();
  const results: T[] = [];
  let completedSteps = 0;

  try {
    // Execute steps in order
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      try {
        const result = await step.execute();
        results.push(result);
        completedSteps++;

        if (onStepComplete) {
          onStepComplete(i + 1, steps.length, step.description);
        }
      } catch (error) {
        // Step failed - rollback all completed steps
        await rollbackSteps(steps.slice(0, completedSteps), onRollback);

        return {
          success: false,
          results,
          completedSteps,
          rolledBack: true,
          error: error as Error,
          duration: Date.now() - startTime,
        };
      }
    }

    // All steps completed successfully
    return {
      success: true,
      results,
      completedSteps,
      rolledBack: false,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    // Unexpected error - attempt rollback
    await rollbackSteps(steps.slice(0, completedSteps), onRollback);

    return {
      success: false,
      results,
      completedSteps,
      rolledBack: true,
      error: error as Error,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Rollback completed steps in reverse order
 */
async function rollbackSteps(
  steps: TransactionStep[],
  onRollback?: (step: number, description?: string) => void
): Promise<void> {
  // Rollback in reverse order
  for (let i = steps.length - 1; i >= 0; i--) {
    const step = steps[i];
    try {
      await step.rollback();
      if (onRollback) {
        onRollback(i, step.description);
      }
    } catch (rollbackError) {
      // Log but continue rolling back
      console.error(
        `Rollback failed for step ${i} (${step.description}):`,
        rollbackError
      );
    }
  }
}

/**
 * Create a transaction step from exec commands
 *
 * Helper to create transaction steps from shell commands.
 *
 * @param executeCmd - Command to execute
 * @param rollbackCmd - Command to rollback
 * @param description - Step description
 * @returns Transaction step
 *
 * @example
 * ```typescript
 * import { exec } from './exec';
 * import { transactionStep } from './transaction';
 *
 * const steps = [
 *   transactionStep(
 *     'cp file.txt file.backup',
 *     'rm file.backup',
 *     'Create backup'
 *   ),
 *   transactionStep(
 *     'sed -i "s/old/new/g" file.txt',
 *     'cp file.backup file.txt',
 *     'Transform file'
 *   )
 * ];
 *
 * await transaction(steps);
 * ```
 */
export function transactionStep(
  executeCmd: string,
  rollbackCmd: string,
  description?: string
): TransactionStep {
  return {
    execute: async () => {
      const { exec } = await import('./exec');
      const result = await exec(executeCmd);
      if (!result.success) {
        throw new Error(`Command failed: ${executeCmd}\n${result.stderr}`);
      }
      return result;
    },
    rollback: async () => {
      const { exec } = await import('./exec');
      await exec(rollbackCmd);
    },
    description,
  };
}

/**
 * Create a file transaction (backup, modify, restore on failure)
 *
 * Common pattern: backup file, modify it, restore backup if anything fails.
 *
 * @param filePath - File to modify
 * @param modifier - Function that modifies file content
 * @param description - Step description
 * @returns Transaction step
 *
 * @example
 * ```typescript
 * import * as fs from 'fs/promises';
 *
 * const step = fileTransaction(
 *   'config.json',
 *   async (content) => {
 *     const config = JSON.parse(content);
 *     config.version = '2.0';
 *     return JSON.stringify(config, null, 2);
 *   },
 *   'Update config version'
 * );
 *
 * await transaction([step]);
 * ```
 */
export function fileTransaction(
  filePath: string,
  modifier: (content: string) => Promise<string>,
  description?: string
): TransactionStep<string> {
  let backup: string;

  return {
    execute: async () => {
      const fs = await import('fs/promises');

      // Create backup
      backup = await fs.readFile(filePath, 'utf-8');

      // Modify file
      const modified = await modifier(backup);
      await fs.writeFile(filePath, modified);

      return modified;
    },
    rollback: async () => {
      const fs = await import('fs/promises');
      // Restore from backup
      if (backup !== undefined) {
        await fs.writeFile(filePath, backup);
      }
    },
    description: description || `Modify ${filePath}`,
  };
}

/**
 * Create multiple file transactions
 *
 * Batch file modifications with automatic rollback.
 *
 * @param files - Array of {path, modifier} pairs
 * @returns Array of transaction steps
 *
 * @example
 * ```typescript
 * const steps = fileTransactions([
 *   {
 *     path: 'package.json',
 *     modifier: async (content) => {
 *       const pkg = JSON.parse(content);
 *       pkg.version = '2.0.0';
 *       return JSON.stringify(pkg, null, 2);
 *     }
 *   },
 *   {
 *     path: 'README.md',
 *     modifier: async (content) =>
 *       content.replace(/v1\.0/g, 'v2.0')
 *   }
 * ]);
 *
 * await transaction(steps);
 * ```
 */
export function fileTransactions(
  files: Array<{
    path: string;
    modifier: (content: string) => Promise<string>;
    description?: string;
  }>
): TransactionStep[] {
  return files.map((file) =>
    fileTransaction(file.path, file.modifier, file.description)
  );
}
