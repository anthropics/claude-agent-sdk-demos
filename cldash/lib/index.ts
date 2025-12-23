/**
 * cldash - Utility library for Claude Code agent workflows
 *
 * Composable primitives that make agentic workflows predictable and debuggable.
 * Inspired by lodash and the Unix philosophy: do one thing well, compose naturally.
 */

export { exec } from './exec';
export type { ExecOptions, ExecResult } from './exec';

export { assert, assertAll, AssertionError } from './assert';
export type { AssertResult } from './assert';

export { retry, retryWithResult, RetryError } from './retry';
export type { RetryOptions, RetryResult } from './retry';

export { pipe, pipeAsync, pipeDebug } from './pipe';

export { parallel, parallelWithRetry, parallelMap, parallelFilter } from './parallel';
export type { ParallelOptions, ParallelResult } from './parallel';

export {
  transaction,
  transactionStep,
  fileTransaction,
  fileTransactions,
} from './transaction';
export type {
  TransactionStep,
  TransactionOptions,
  TransactionResult,
} from './transaction';
