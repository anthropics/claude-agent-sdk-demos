# cldash API Reference

Complete documentation for all cldash utilities.

## Table of Contents

- [Core Utilities](#core-utilities)
  - [exec()](#exec)
  - [assert()](#assert)
  - [retry()](#retry)
  - [pipe()](#pipe)
- [Parallel Execution](#parallel-execution)
  - [parallel()](#parallel)
  - [parallelMap()](#parallelmap)
  - [parallelFilter()](#parallelfilter)
  - [parallelWithRetry()](#parallelwithretry)
- [Transactions](#transactions)
  - [transaction()](#transaction)
  - [transactionStep()](#transactionstep)
  - [fileTransaction()](#filetransaction)
  - [fileTransactions()](#filetransactions)

---

## Core Utilities

### exec()

Enhanced command execution with structured output, dry-run mode, and streaming.

```typescript
function exec(command: string, options?: ExecOptions): Promise<ExecResult>
```

**Options**:
```typescript
interface ExecOptions {
  cwd?: string;           // Working directory
  timeout?: number;       // Timeout in ms (default: 120000)
  maxBuffer?: number;     // Max stdout/stderr buffer (default: 10MB)
  dryRun?: boolean;       // Preview without executing
  onData?: (data: string, stream: 'stdout' | 'stderr') => void; // Stream output
}
```

**Returns**:
```typescript
interface ExecResult {
  stdout: string;         // Standard output
  stderr: string;         // Standard error
  exitCode: number;       // Exit code (0 = success)
  duration: number;       // Execution time in ms
  success: boolean;       // true if exitCode === 0
  command: string;        // The command that was executed
  dryRun?: boolean;       // true if this was a dry run
}
```

**Examples**:

Basic usage:
```typescript
const result = await exec('npm test');
if (result.success) {
  console.log('Tests passed!', result.stdout);
} else {
  console.error('Tests failed:', result.stderr);
  console.error('Exit code:', result.exitCode);
}
```

Dry-run preview:
```typescript
const preview = await exec('rm -rf important/', { dryRun: true });
console.log('Would execute:', preview.command);
// Nothing actually happens!
```

Streaming progress:
```typescript
await exec('npm install', {
  onData: (data, stream) => {
    if (stream === 'stdout') {
      console.log('Installing:', data);
    }
  }
});
```

With timeout:
```typescript
const result = await exec('long-running-command', {
  timeout: 30000, // 30 seconds
  onData: (data) => console.log('Progress:', data)
});
```

---

### assert()

Verify conditions with structured feedback for agent self-assessment.

```typescript
function assert(
  condition: boolean,
  message: string,
  throwOnFailure?: boolean
): AssertResult
```

**Parameters**:
- `condition` - Boolean condition to verify
- `message` - Description of what's being verified
- `throwOnFailure` - Whether to throw on failure (default: true)

**Returns**:
```typescript
interface AssertResult {
  passed: boolean;
  message: string;
  condition?: boolean;
}
```

**Throws**: `AssertionError` if condition is false and throwOnFailure is true

**Examples**:

Basic assertion (throws on failure):
```typescript
assert(fileExists('config.json'), 'Config file must exist');
```

Non-throwing assertion:
```typescript
const result = assert(tests.passed, 'Tests must pass', false);
if (!result.passed) {
  console.log('Verification failed:', result.message);
}
```

Multiple assertions:
```typescript
const checks = assertAll([
  [fileExists('index.ts'), 'Entry point must exist'],
  [tests.passed, 'Tests must pass'],
  [linter.errors.length === 0, 'No linting errors']
]);

const allPassed = checks.every(c => c.passed);
```

In workflows:
```typescript
const result = await exec('npm test');
assert(result.success, 'Tests must pass before deployment');

const build = await exec('npm run build');
assert(build.success, 'Build must succeed');
```

---

### retry()

Retry operations with exponential backoff and jitter.

```typescript
function retry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
): Promise<T>
```

**Options**:
```typescript
interface RetryOptions {
  attempts?: number;      // Number of attempts (default: 3)
  backoff?: number;       // Initial backoff in ms (default: 1000)
  maxBackoff?: number;    // Max backoff in ms (default: 30000)
  onRetry?: (attempt: number, error: Error) => void; // Called on each retry
}
```

**Returns**: Result of successful attempt

**Throws**: `RetryError` with all attempt details if all attempts fail

**Examples**:

Retry flaky tests:
```typescript
const result = await retry(
  async () => {
    const test = await exec('npm test');
    if (!test.success) throw new Error('Tests failed');
    return test;
  },
  { attempts: 3, backoff: 2000 }
);
```

Retry with callback:
```typescript
await retry(
  () => fetchAPI('https://api.example.com/data'),
  {
    attempts: 5,
    backoff: 1000,
    onRetry: (attempt, error) => {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
    }
  }
);
```

Retry file operations:
```typescript
const content = await retry(
  () => fs.readFile('locked-file.txt', 'utf-8'),
  { attempts: 3, backoff: 100 }
);
```

With structured result (doesn't throw):
```typescript
const { success, result, error, attempts } = await retryWithResult(
  () => fetchAPI(),
  { attempts: 3 }
);

if (!success) {
  console.error(`Failed after ${attempts} attempts:`, error);
}
```

---

### pipe()

Compose functions into readable pipelines (left-to-right execution).

```typescript
function pipe<T>(...fns: Array<(arg: any) => any>): (input: T) => any
```

**Parameters**:
- `fns` - Functions to compose (executed left to right)

**Returns**: New function that applies all transformations in sequence

**Examples**:

Basic pipeline:
```typescript
const processFile = pipe(
  readFile,
  parseJSON,
  validateSchema,
  transformData,
  writeFile
);

const result = await processFile('data.json');
```

Async pipeline:
```typescript
const workflow = pipeAsync(
  async (file) => await exec(`cat ${file}`),
  async (result) => result.stdout,
  async (content) => content.toUpperCase(),
  async (upper) => await exec(`echo "${upper}" > output.txt`)
);

await workflow('input.txt');
```

Debug pipeline (logs each step):
```typescript
const debugWorkflow = pipeDebug(
  step1,  // Logs input/output
  step2,  // Logs input/output
  step3   // Logs input/output
);

const result = debugWorkflow(input);
```

Real-world example:
```typescript
const deployPipeline = pipe(
  loadConfig,
  validateEnvironment,
  buildApplication,
  runTests,
  deployToStaging,
  runSmokeTests,
  deployToProduction
);

await deployPipeline('config.json');
```

---

## Parallel Execution

### parallel()

Execute tasks in parallel with concurrency control and progress tracking.

```typescript
function parallel<T>(
  tasks: Array<() => Promise<T>>,
  options?: ParallelOptions
): Promise<ParallelResult<T>>
```

**Options**:
```typescript
interface ParallelOptions {
  concurrency?: number;   // Max concurrent tasks (default: 10)
  onProgress?: (completed: number, total: number) => void;
  stopOnError?: boolean;  // Stop all on first error (default: false)
}
```

**Returns**:
```typescript
interface ParallelResult<T> {
  results: Array<T | Error>;  // Results or errors for each task
  successful: number;          // Count of successful tasks
  failed: number;              // Count of failed tasks
  duration: number;            // Total execution time in ms
}
```

**Examples**:

Migrate files with concurrency limit:
```typescript
const tasks = files.map(file => () => migrateFile(file));

const result = await parallel(tasks, {
  concurrency: 5,  // Only 5 files at a time
  onProgress: (done, total) => {
    console.log(`Progress: ${done}/${total}`);
  }
});

console.log(`${result.successful} succeeded, ${result.failed} failed`);
```

Process with error handling:
```typescript
const result = await parallel(tasks, {
  concurrency: 10,
  stopOnError: false  // Continue even if some fail
});

// Check individual results
result.results.forEach((r, i) => {
  if (r instanceof Error) {
    console.error(`Task ${i} failed:`, r.message);
  } else {
    console.log(`Task ${i} succeeded:`, r);
  }
});
```

---

### parallelMap()

Like Array.map() but async with concurrency control.

```typescript
function parallelMap<T, R>(
  items: T[],
  fn: (item: T, index: number) => Promise<R>,
  options?: ParallelOptions
): Promise<ParallelResult<R>>
```

**Examples**:

Transform array in parallel:
```typescript
const migrated = await parallelMap(
  files,
  async (file) => await migrateFile(file),
  { concurrency: 5 }
);
```

With progress:
```typescript
const processed = await parallelMap(
  data,
  async (item, index) => {
    return await processItem(item);
  },
  {
    concurrency: 10,
    onProgress: (done, total) => {
      console.log(`${done}/${total} items processed`);
    }
  }
);
```

---

### parallelFilter()

Like Array.filter() but async with concurrency control.

```typescript
function parallelFilter<T>(
  items: T[],
  predicate: (item: T, index: number) => Promise<boolean>,
  options?: ParallelOptions
): Promise<T[]>
```

**Examples**:

Filter files that exist:
```typescript
const existing = await parallelFilter(
  filePaths,
  async (path) => await fileExists(path),
  { concurrency: 10 }
);
```

Filter with complex predicate:
```typescript
const valid = await parallelFilter(
  configs,
  async (config) => {
    const result = await validateConfig(config);
    return result.valid;
  },
  { concurrency: 5 }
);
```

---

### parallelWithRetry()

Combine parallel execution with automatic retry for each task.

```typescript
function parallelWithRetry<T>(
  tasks: Array<() => Promise<T>>,
  options?: ParallelOptions & { attempts?: number; backoff?: number }
): Promise<ParallelResult<T>>
```

**Examples**:

Process with retry for flaky operations:
```typescript
const result = await parallelWithRetry(
  files.map(f => () => processFile(f)),
  {
    concurrency: 5,
    attempts: 3,
    backoff: 1000,
    onProgress: (done, total) => console.log(`${done}/${total}`)
  }
);
```

---

## Transactions

### transaction()

Execute operations atomically with automatic rollback on failure.

```typescript
function transaction<T>(
  steps: TransactionStep<T>[],
  options?: TransactionOptions
): Promise<TransactionResult<T>>
```

**Step Definition**:
```typescript
interface TransactionStep<T = any> {
  execute: () => Promise<T>;
  rollback: () => Promise<void>;
  description?: string;
}
```

**Options**:
```typescript
interface TransactionOptions {
  onStepComplete?: (step: number, total: number, description?: string) => void;
  onRollback?: (step: number, description?: string) => void;
}
```

**Returns**:
```typescript
interface TransactionResult<T> {
  success: boolean;
  results: T[];
  completedSteps: number;
  rolledBack: boolean;
  error?: Error;
  duration: number;
}
```

**Examples**:

Git workflow with rollback:
```typescript
const result = await transaction([
  {
    execute: () => exec('git add .'),
    rollback: () => exec('git reset'),
    description: 'Stage changes'
  },
  {
    execute: () => exec('git commit -m "changes"'),
    rollback: () => exec('git reset HEAD~1'),
    description: 'Commit changes'
  },
  {
    execute: async () => {
      const result = await exec('npm test');
      assert(result.success, 'Tests must pass');
      return result;
    },
    rollback: () => Promise.resolve(),
    description: 'Run tests'
  },
  {
    execute: () => exec('git push'),
    rollback: () => exec('git reset --hard HEAD~1 && git push -f'),
    description: 'Push to remote'
  }
]);

if (!result.success) {
  console.log('Transaction failed and rolled back:', result.error);
}
```

With progress tracking:
```typescript
await transaction(steps, {
  onStepComplete: (step, total, desc) => {
    console.log(`✓ Step ${step}/${total}: ${desc}`);
  },
  onRollback: (step, desc) => {
    console.log(`↩️ Rolling back: ${desc}`);
  }
});
```

---

### transactionStep()

Helper to create transaction steps from shell commands.

```typescript
function transactionStep(
  executeCmd: string,
  rollbackCmd: string,
  description?: string
): TransactionStep
```

**Examples**:

Create backup/restore step:
```typescript
const steps = [
  transactionStep(
    'cp file.txt file.backup',
    'rm file.backup',
    'Create backup'
  ),
  transactionStep(
    'sed -i "s/old/new/g" file.txt',
    'cp file.backup file.txt',
    'Transform file'
  )
];

await transaction(steps);
```

---

### fileTransaction()

Transaction step for file modification with automatic backup/restore.

```typescript
function fileTransaction(
  filePath: string,
  modifier: (content: string) => Promise<string>,
  description?: string
): TransactionStep<string>
```

**Examples**:

Modify config file:
```typescript
const step = fileTransaction(
  'config.json',
  async (content) => {
    const config = JSON.parse(content);
    config.version = '2.0';
    return JSON.stringify(config, null, 2);
  },
  'Update config version'
);

await transaction([step]);
```

Transform multiple files:
```typescript
const step = fileTransaction(
  'package.json',
  async (content) => {
    const pkg = JSON.parse(content);
    pkg.dependencies['new-lib'] = '^1.0.0';
    return JSON.stringify(pkg, null, 2);
  }
);
```

---

### fileTransactions()

Create multiple file transaction steps at once.

```typescript
function fileTransactions(
  files: Array<{
    path: string;
    modifier: (content: string) => Promise<string>;
    description?: string;
  }>
): TransactionStep[]
```

**Examples**:

Batch file modifications:
```typescript
const steps = fileTransactions([
  {
    path: 'package.json',
    modifier: async (content) => {
      const pkg = JSON.parse(content);
      pkg.version = '2.0.0';
      return JSON.stringify(pkg, null, 2);
    },
    description: 'Bump version'
  },
  {
    path: 'README.md',
    modifier: async (content) =>
      content.replace(/v1\.0/g, 'v2.0'),
    description: 'Update docs'
  },
  {
    path: 'CHANGELOG.md',
    modifier: async (content) =>
      `## v2.0.0\n\n- Major update\n\n${content}`,
    description: 'Add changelog entry'
  }
]);

await transaction(steps);
```

---

## Complete Examples

### Code Migration Workflow

```typescript
import {
  exec,
  parallel,
  transaction,
  transactionStep,
  retry,
  assert
} from 'cldash';

async function migrateCodebase(pattern: string) {
  // Find files
  const findResult = await exec(`find . -name "${pattern}"`);
  assert(findResult.success, 'File search must succeed');
  const files = findResult.stdout.split('\n').filter(Boolean);

  // Execute with transaction
  const result = await transaction([
    // Step 1: Backup
    transactionStep(
      `tar -czf backup.tar.gz ${files.join(' ')}`,
      'rm backup.tar.gz',
      'Create backup'
    ),

    // Step 2: Pre-tests
    {
      execute: async () => {
        const result = await retry(() => exec('npm test'), {attempts: 2});
        assert(result.success, 'Tests must pass');
        return result;
      },
      rollback: async () => {},
      description: 'Run pre-migration tests'
    },

    // Step 3: Migrate in parallel
    {
      execute: () => parallel(
        files.map(f => () => migrateFile(f)),
        {
          concurrency: 5,
          onProgress: (done, total) => console.log(`${done}/${total}`)
        }
      ),
      rollback: async () => {
        await exec('tar -xzf backup.tar.gz');
      },
      description: 'Migrate files'
    },

    // Step 4: Post-tests
    {
      execute: async () => {
        const result = await exec('npm test');
        assert(result.success, 'Tests must still pass');
        return result;
      },
      rollback: async () => {},
      description: 'Run post-migration tests'
    },

    // Step 5: Cleanup
    transactionStep('rm backup.tar.gz', 'echo done', 'Remove backup')
  ]);

  return result;
}
```

### Deployment Pipeline

```typescript
async function deploy() {
  return transaction([
    {
      execute: () => exec('npm run build'),
      rollback: () => exec('rm -rf dist'),
      description: 'Build application'
    },
    {
      execute: async () => {
        const result = await exec('npm test');
        assert(result.success, 'Tests must pass');
        return result;
      },
      rollback: () => Promise.resolve(),
      description: 'Run tests'
    },
    {
      execute: () => exec('npm run deploy:staging'),
      rollback: () => exec('npm run rollback:staging'),
      description: 'Deploy to staging'
    },
    {
      execute: () => exec('npm run smoke-tests'),
      rollback: () => Promise.resolve(),
      description: 'Run smoke tests'
    },
    {
      execute: () => exec('npm run deploy:production'),
      rollback: () => exec('npm run rollback:production'),
      description: 'Deploy to production'
    }
  ]);
}
```

---

## Best Practices

### 1. Always Use Structured Output

```typescript
// ❌ Don't parse raw output
const output = await bash('npm test');
if (output.includes('PASS')) { ... }

// ✅ Use structured results
const result = await exec('npm test');
if (result.success) { ... }
```

### 2. Add Verification Gates

```typescript
// ❌ Silent failures
await migrateFiles();
await deploy();

// ✅ Explicit verification
const migration = await migrateFiles();
assert(migration.success, 'Migration must succeed');

const tests = await exec('npm test');
assert(tests.success, 'Tests must pass before deploy');

await deploy();
```

### 3. Use Transactions for Multi-Step Operations

```typescript
// ❌ Manual rollback
try {
  await step1();
  await step2();
  await step3();
} catch (e) {
  // Manually undo everything?
}

// ✅ Automatic rollback
await transaction([
  {execute: step1, rollback: undoStep1},
  {execute: step2, rollback: undoStep2},
  {execute: step3, rollback: undoStep3}
]);
```

### 4. Control Concurrency

```typescript
// ❌ Overwhelm resources
await Promise.all(1000files.map(f => process(f)));

// ✅ Controlled concurrency
await parallel(
  1000files.map(f => () => process(f)),
  {concurrency: 10}
);
```

### 5. Retry Flaky Operations

```typescript
// ❌ Fail on transient errors
const data = await fetchAPI();

// ✅ Resilient
const data = await retry(
  () => fetchAPI(),
  {attempts: 3, backoff: 1000}
);
```
