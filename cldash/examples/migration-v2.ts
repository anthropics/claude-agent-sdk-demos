/**
 * Code Migration V2 - Showcasing ALL cldash features
 *
 * This demonstrates the complete power of cldash:
 * - exec() with dryRun and progress
 * - parallel() with concurrency control
 * - transaction() with automatic rollback
 * - retry() for resilience
 * - assert() for verification
 * - pipe() for composition
 */

import {
  exec,
  parallel,
  transaction,
  transactionStep,
  fileTransaction,
  retry,
  assert,
  pipe,
} from '../lib/index';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Part 1: Dry Run - Preview Before Executing
// ============================================================================

async function previewMigration(pattern: string): Promise<void> {
  console.log('🔍 DRY RUN: Previewing migration...\n');

  // Find files (no dry run needed - just reading)
  const findResult = await exec(`find . -name "${pattern}"`);
  const files = findResult.stdout.split('\n').filter(Boolean);

  console.log(`Would migrate ${files.length} files:\n`);
  files.forEach((file, i) => {
    console.log(`  ${i + 1}. ${file}`);
  });

  // Preview backup command
  const backupCmd = `tar -czf backup.tar.gz ${files.join(' ')}`;
  const backupPreview = await exec(backupCmd, { dryRun: true });
  console.log(`\nWould execute: ${backupPreview.command}`);

  // Preview test command
  const testPreview = await exec('npm test', { dryRun: true });
  console.log(`Would execute: ${testPreview.command}\n`);
}

// ============================================================================
// Part 2: Parallel Migration with Progress
// ============================================================================

interface MigrationResult {
  file: string;
  success: boolean;
  linesChanged: number;
  error?: string;
}

async function migrateFileWithProgress(filePath: string): Promise<MigrationResult> {
  try {
    // Read with retry
    const content = await retry(() => fs.readFile(filePath, 'utf-8'), {
      attempts: 3,
      backoff: 100,
    });

    const requireCount = (content.match(/require\(/g) || []).length;

    // Transform
    const migrated = content.replace(
      /const (\w+) = require\(['"](.+)['"]\);/g,
      "import $1 from '$2';"
    );

    // Write with retry
    await retry(() => fs.writeFile(filePath, migrated), {
      attempts: 3,
      backoff: 100,
    });

    return {
      file: filePath,
      success: true,
      linesChanged: requireCount,
    };
  } catch (error: any) {
    return {
      file: filePath,
      success: false,
      linesChanged: 0,
      error: error.message,
    };
  }
}

async function migrateInParallel(
  files: string[],
  concurrency: number = 5
): Promise<void> {
  console.log(`\n🔄 Migrating ${files.length} files (${concurrency} at a time)...\n`);

  // Create tasks
  const tasks = files.map((file) => () => migrateFileWithProgress(file));

  // Execute in parallel with progress tracking
  const result = await parallel(tasks, {
    concurrency,
    onProgress: (completed, total) => {
      const percent = Math.round((completed / total) * 100);
      process.stdout.write(`\r  Progress: ${completed}/${total} (${percent}%)`);
    },
  });

  console.log('\n');
  console.log(`✅ Completed: ${result.successful} succeeded, ${result.failed} failed`);
  console.log(`⏱️  Duration: ${result.duration}ms\n`);

  // Show failures
  const failures = result.results.filter(
    (r): r is MigrationResult & { error: string } =>
      r instanceof Error || (typeof r === 'object' && 'error' in r && !r.success)
  );

  if (failures.length > 0) {
    console.log('❌ Failed files:');
    failures.forEach((f) => {
      if (f instanceof Error) {
        console.log(`  - Error: ${f.message}`);
      } else {
        console.log(`  - ${f.file}: ${f.error}`);
      }
    });
    console.log('');
  }
}

// ============================================================================
// Part 3: Transaction-Based Migration with Rollback
// ============================================================================

async function migrateWithTransaction(files: string[]): Promise<void> {
  console.log('💰 Transaction-based migration (with automatic rollback)...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  const steps = [
    // Step 1: Create backup
    transactionStep(
      `tar -czf backup-${timestamp}.tar.gz ${files.join(' ')}`,
      `rm backup-${timestamp}.tar.gz`,
      'Create backup'
    ),

    // Step 2: Run pre-migration tests
    {
      execute: async () => {
        console.log('  Running pre-migration tests...');
        const result = await exec('echo "Tests would run here"'); // Mock for demo
        assert(result.success, 'Pre-migration tests must pass');
        return result;
      },
      rollback: async () => {
        // No rollback needed for test execution
      },
      description: 'Run pre-migration tests',
    },

    // Step 3: Migrate files
    {
      execute: async () => {
        console.log('  Migrating files...');
        await migrateInParallel(files, 3); // 3 concurrent
        return { migrated: files.length };
      },
      rollback: async () => {
        console.log('  Rolling back file changes...');
        await exec(`tar -xzf backup-${timestamp}.tar.gz`);
      },
      description: 'Migrate files',
    },

    // Step 4: Run post-migration tests
    {
      execute: async () => {
        console.log('  Running post-migration tests...');
        const result = await exec('echo "Tests would run here"'); // Mock for demo
        assert(result.success, 'Post-migration tests must pass');
        return result;
      },
      rollback: async () => {
        // No rollback needed
      },
      description: 'Run post-migration tests',
    },

    // Step 5: Clean up backup
    transactionStep(
      `rm backup-${timestamp}.tar.gz`,
      `echo "Backup already removed"`,
      'Clean up backup'
    ),
  ];

  const result = await transaction(steps, {
    onStepComplete: (step, total, desc) => {
      console.log(`  ✓ Step ${step}/${total}: ${desc}`);
    },
    onRollback: (step, desc) => {
      console.log(`  ↩️  Rolling back: ${desc}`);
    },
  });

  if (result.success) {
    console.log('\n✅ Transaction completed successfully!');
    console.log(`   Completed ${result.completedSteps} steps in ${result.duration}ms\n`);
  } else {
    console.log('\n❌ Transaction failed and was rolled back');
    console.log(`   Error: ${result.error?.message}`);
    console.log(`   Completed ${result.completedSteps} steps before failure\n`);
  }
}

// ============================================================================
// Part 4: Complete Migration Pipeline
// ============================================================================

const migrationWorkflow = pipe(
  // Step 1: Find files
  async (pattern: string) => {
    console.log(`🔍 Finding files matching "${pattern}"...`);
    const result = await exec(`find . -name "${pattern}"`);
    assert(result.success, 'File search must succeed');
    const files = result.stdout.split('\n').filter(Boolean);
    console.log(`   Found ${files.length} files\n`);
    return files;
  },

  // Step 2: Preview (optional dry run)
  async (files: string[]) => {
    console.log('👀 Preview mode - showing what would change...');
    const samples = files.slice(0, 3);
    for (const file of samples) {
      const content = await fs.readFile(file, 'utf-8');
      const requires = (content.match(/require\(/g) || []).length;
      console.log(`   ${file}: ${requires} require() calls`);
    }
    console.log('');
    return files;
  },

  // Step 3: Migrate with transaction
  async (files: string[]) => {
    await migrateWithTransaction(files);
    return files;
  }
);

// ============================================================================
// Part 5: Streaming Progress Demo
// ============================================================================

async function migrateWithStreamingProgress(): Promise<void> {
  console.log('📡 Demo: Streaming progress from long-running command\n');

  await exec('echo "Line 1" && sleep 0.5 && echo "Line 2" && sleep 0.5 && echo "Done"', {
    onData: (data, stream) => {
      if (stream === 'stdout') {
        console.log(`  [stdout] ${data.trim()}`);
      } else {
        console.error(`  [stderr] ${data.trim()}`);
      }
    },
  });

  console.log('\n✅ Streaming complete\n');
}

// ============================================================================
// DEMO RUNNER
// ============================================================================

async function demo() {
  console.log('🚀 cldash V2 Demo - All Features\n');
  console.log('=' .repeat(70));
  console.log('');

  // Create test files
  const testDir = path.join(process.cwd(), 'migration-v2-test');
  await fs.mkdir(testDir, { recursive: true });

  const testFiles = [
    path.join(testDir, 'file1.js'),
    path.join(testDir, 'file2.js'),
    path.join(testDir, 'file3.js'),
  ];

  for (const file of testFiles) {
    await fs.writeFile(
      file,
      `const lodash = require('lodash');\nconst axios = require('axios');\n`
    );
  }

  console.log('Created test files\n');
  console.log('=' .repeat(70));
  console.log('');

  try {
    // Demo 1: Dry run
    console.log('DEMO 1: Dry Run Preview\n');
    await previewMigration('file*.js');
    console.log('=' .repeat(70));
    console.log('');

    // Demo 2: Parallel execution
    console.log('DEMO 2: Parallel Migration with Progress\n');
    await migrateInParallel(testFiles, 2);
    console.log('=' .repeat(70));
    console.log('');

    // Restore files for next demo
    for (const file of testFiles) {
      await fs.writeFile(
        file,
        `const lodash = require('lodash');\nconst axios = require('axios');\n`
      );
    }

    // Demo 3: Transaction-based
    console.log('DEMO 3: Transaction with Rollback\n');
    await migrateWithTransaction(testFiles);
    console.log('=' .repeat(70));
    console.log('');

    // Demo 4: Streaming progress
    console.log('DEMO 4: Streaming Progress\n');
    await migrateWithStreamingProgress();
    console.log('=' .repeat(70));
    console.log('');

  } finally {
    // Cleanup
    console.log('🗑️  Cleaning up...');
    await exec(`rm -rf ${testDir}`);
    console.log('✅ Demo complete!\n');
  }

  console.log('Key features demonstrated:');
  console.log('  ✅ exec() with dryRun mode');
  console.log('  ✅ exec() with streaming progress (onData)');
  console.log('  ✅ parallel() with concurrency control');
  console.log('  ✅ transaction() with automatic rollback');
  console.log('  ✅ retry() for resilient operations');
  console.log('  ✅ assert() for verification gates');
  console.log('  ✅ pipe() for workflow composition\n');
}

// Run demo
if (require.main === module) {
  demo().catch(console.error);
}

export { previewMigration, migrateInParallel, migrateWithTransaction };
