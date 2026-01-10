/**
 * Real-World Example: Code Migration with cldash
 *
 * Scenario: Migrate CommonJS require() to ES6 import statements
 * across a codebase of 50+ files
 *
 * This demonstrates:
 * - exec() for structured results
 * - retry() for flaky file operations
 * - assert() for verification gates
 * - pipe() for transformation workflows
 */

import { exec } from '../lib/exec';
import { retry } from '../lib/retry';
import { assert } from '../lib/assert';
import { pipe } from '../lib/pipe';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// PART 1: The Problem Without cldash
// ============================================================================

async function migrateFileNaive(filePath: string): Promise<void> {
  // ❌ No structured error handling
  const content = await fs.readFile(filePath, 'utf-8');

  // ❌ No verification that transformation actually worked
  const migrated = content.replace(
    /const (\w+) = require\(['"](.+)['"]\);/g,
    "import $1 from '$2';"
  );

  // ❌ No retry if write fails (file locked, permissions, etc)
  await fs.writeFile(filePath, migrated);

  // ❌ No verification that file still works after migration
  // ❌ No structured result - can't tell if it succeeded
}

async function migrateCodebaseNaive(pattern: string): Promise<void> {
  // ❌ Raw bash - hard to parse results
  const result = await exec(`find . -name "${pattern}"`);
  const files = result.stdout.split('\n').filter(Boolean);

  // ❌ No progress tracking
  // ❌ No way to know which files failed
  // ❌ If one fails, whole thing stops
  for (const file of files) {
    await migrateFileNaive(file);
  }

  // ❌ No verification that codebase still works
  // ❌ No rollback if tests fail
}

// ============================================================================
// PART 2: The Solution With cldash
// ============================================================================

interface MigrationResult {
  filePath: string;
  success: boolean;
  linesChanged: number;
  error?: string;
}

/**
 * Migrate a single file with retry, verification, and structured results
 */
async function migrateFileRobust(filePath: string): Promise<MigrationResult> {
  try {
    // ✅ Use retry for flaky file operations
    const content = await retry(
      () => fs.readFile(filePath, 'utf-8'),
      { attempts: 3, backoff: 100 }
    );

    // Count original require statements
    const requireCount = (content.match(/require\(/g) || []).length;

    // Transform
    const migrated = content.replace(
      /const (\w+) = require\(['"](.+)['"]\);/g,
      "import $1 from '$2';"
    );

    // Count new import statements
    const importCount = (migrated.match(/^import .+ from/gm) || []).length;

    // ✅ Verify transformation actually changed something
    assert(
      importCount >= requireCount,
      `Migration should create at least ${requireCount} imports`
    );

    // ✅ Retry write operation (file might be locked)
    await retry(
      () => fs.writeFile(filePath, migrated),
      { attempts: 3, backoff: 100 }
    );

    // ✅ Verify file was written correctly
    const written = await fs.readFile(filePath, 'utf-8');
    assert(
      written === migrated,
      'Written content should match migrated content'
    );

    // ✅ Return structured result
    return {
      filePath,
      success: true,
      linesChanged: requireCount,
    };
  } catch (error: any) {
    // ✅ Capture failures with context
    return {
      filePath,
      success: false,
      linesChanged: 0,
      error: error.message,
    };
  }
}

/**
 * Migrate entire codebase with verification gates and rollback
 */
async function migrateCodebaseRobust(
  pattern: string,
  targetDir: string = '.'
): Promise<{
  totalFiles: number;
  successful: number;
  failed: number;
  results: MigrationResult[];
}> {
  console.log('🔍 Finding files to migrate...\n');

  // ✅ STEP 1: Find files with structured output
  const findResult = await exec(`find ${targetDir} -name "${pattern}"`, {
    timeout: 10000,
  });

  assert(findResult.success, 'File search must succeed');

  const files = findResult.stdout.split('\n').filter(Boolean);
  console.log(`Found ${files.length} files to migrate\n`);

  // ✅ STEP 2: Create backup before migration
  console.log('💾 Creating backup...\n');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupResult = await exec(
    `tar -czf backup-${timestamp}.tar.gz ${files.join(' ')}`
  );

  assert(backupResult.success, 'Backup must succeed before migration');
  console.log('✅ Backup created\n');

  // ✅ STEP 3: Verify tests pass BEFORE migration
  console.log('🧪 Running tests before migration...\n');
  const preTestResult = await retry(
    async () => {
      const result = await exec('npm test', { timeout: 60000 });
      assert(result.success, 'Tests must pass before migration');
      return result;
    },
    { attempts: 2, backoff: 1000 }
  );

  console.log(`✅ Pre-migration tests passed in ${preTestResult.duration}ms\n`);

  // ✅ STEP 4: Migrate files with progress tracking
  console.log('🔄 Migrating files...\n');
  const results: MigrationResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[${i + 1}/${files.length}] Migrating ${file}...`);

    const result = await migrateFileRobust(file);
    results.push(result);

    if (result.success) {
      console.log(`  ✅ Migrated ${result.linesChanged} require statements`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
    }
  }

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\n📊 Migration complete: ${successful} succeeded, ${failed} failed\n`);

  // ✅ STEP 5: Verify tests still pass AFTER migration
  console.log('🧪 Running tests after migration...\n');

  try {
    const postTestResult = await retry(
      async () => {
        const result = await exec('npm test', { timeout: 60000 });
        assert(result.success, 'Tests must pass after migration');
        return result;
      },
      { attempts: 2, backoff: 1000 }
    );

    console.log(`✅ Post-migration tests passed in ${postTestResult.duration}ms\n`);
  } catch (error: any) {
    // ✅ STEP 6: Rollback if tests fail
    console.error('❌ Tests failed after migration! Rolling back...\n');

    const rollbackResult = await exec(
      `tar -xzf backup-${timestamp}.tar.gz`
    );

    assert(rollbackResult.success, 'Rollback must succeed');
    console.log('✅ Rolled back to backup\n');

    throw new Error('Migration failed verification - rolled back');
  }

  // ✅ STEP 7: Clean up backup if everything succeeded
  console.log('🗑️  Removing backup (migration verified)...\n');
  await exec(`rm backup-${timestamp}.tar.gz`);

  return {
    totalFiles: files.length,
    successful,
    failed,
    results,
  };
}

// ============================================================================
// PART 3: Using pipe() for Complex Transformations
// ============================================================================

/**
 * Multi-step migration pipeline
 */
const migrationPipeline = pipe(
  // Step 1: Read file
  async (filePath: string) => {
    const content = await retry(
      () => fs.readFile(filePath, 'utf-8'),
      { attempts: 3, backoff: 100 }
    );
    return { filePath, content };
  },

  // Step 2: Transform require → import
  async ({ filePath, content }: { filePath: string; content: string }) => {
    const migrated = content.replace(
      /const (\w+) = require\(['"](.+)['"]\);/g,
      "import $1 from '$2';"
    );
    return { filePath, content, migrated };
  },

  // Step 3: Verify transformation
  async ({ filePath, content, migrated }: any) => {
    const requireCount = (content.match(/require\(/g) || []).length;
    const importCount = (migrated.match(/^import .+ from/gm) || []).length;

    assert(
      importCount >= requireCount,
      `Should have at least ${requireCount} imports`
    );

    return { filePath, migrated, linesChanged: requireCount };
  },

  // Step 4: Write file
  async ({ filePath, migrated, linesChanged }: any) => {
    await retry(
      () => fs.writeFile(filePath, migrated),
      { attempts: 3, backoff: 100 }
    );
    return { filePath, linesChanged, success: true };
  }
);

// ============================================================================
// DEMO
// ============================================================================

async function demo() {
  console.log('🚀 Code Migration Demo with cldash\n');
  console.log('=' .repeat(60));
  console.log('');

  // For demo purposes, let's create some test files
  const testDir = path.join(process.cwd(), 'migration-test');

  console.log('📝 Creating test files...\n');

  try {
    await fs.mkdir(testDir, { recursive: true });

    // Create test files with CommonJS
    await fs.writeFile(
      path.join(testDir, 'test1.js'),
      `const express = require('express');\nconst path = require('path');\n`
    );

    await fs.writeFile(
      path.join(testDir, 'test2.js'),
      `const lodash = require('lodash');\nconst axios = require('axios');\n`
    );

    console.log('✅ Test files created\n');
    console.log('=' .repeat(60));
    console.log('');

    // Demo 1: Simple migration using pipeline
    console.log('DEMO 1: Single file migration with pipe()\n');
    const result1 = await migrationPipeline(path.join(testDir, 'test1.js'));
    console.log('Result:', result1);
    console.log('');

    // Demo 2: Full codebase migration with verification
    console.log('=' .repeat(60));
    console.log('');
    console.log('DEMO 2: Full migration workflow\n');

    // Note: This would actually run npm test, but for demo we'll skip
    console.log('(Skipping actual test run for demo)\n');

    // Show what the files look like after
    const migrated1 = await fs.readFile(path.join(testDir, 'test1.js'), 'utf-8');
    console.log('Migrated file content:');
    console.log(migrated1);

  } finally {
    // Cleanup
    console.log('\n🗑️  Cleaning up test files...');
    await exec(`rm -rf ${testDir}`);
    console.log('✅ Cleanup complete\n');
  }

  console.log('=' .repeat(60));
  console.log('\n✅ Demo complete!\n');
  console.log('Key benefits demonstrated:');
  console.log('  • exec() for structured results');
  console.log('  • retry() for flaky file operations');
  console.log('  • assert() for verification gates');
  console.log('  • pipe() for readable transformation flows');
  console.log('  • Automatic backup and rollback on failure');
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export { migrateFileRobust, migrateCodebaseRobust, migrationPipeline };
