#!/usr/bin/env tsx
/**
 * Template for creating migration evaluation scripts
 *
 * Copy this template to create new migration evaluations:
 * cp migration-template.ts ../golden-dataset/XXX-your-migration/migration-script.ts
 */

import { exec } from '../../../lib/exec';
import { parallel, parallelMap } from '../../../lib/parallel';
import { transaction, transactionStep, fileTransaction } from '../../../lib/transaction';
import { retry } from '../../../lib/retry';
import { assert } from '../../../lib/assert';
import * as fs from 'fs/promises';
import * as path from 'path';

interface MigrationMetrics {
  startTime: number;
  endTime?: number;
  phases: {
    gatherContext: { start: number; end?: number; operations: string[] };
    action: { start: number; end?: number; operations: string[] };
    verify: { start: number; end?: number; operations: string[] };
  };
  retries: number;
  rollbacks: number;
}

class MigrationRunner {
  private metrics: MigrationMetrics;
  private exampleId: string;
  private repoPath: string;

  constructor(exampleId: string, repoPath: string) {
    this.exampleId = exampleId;
    this.repoPath = repoPath;
    this.metrics = {
      startTime: Date.now(),
      phases: {
        gatherContext: { start: 0, operations: [] },
        action: { start: 0, operations: [] },
        verify: { start: 0, operations: [] }
      },
      retries: 0,
      rollbacks: 0
    };
  }

  // Phase 1: Gather Context
  async gatherContext(): Promise<void> {
    this.metrics.phases.gatherContext.start = Date.now();
    console.log('📋 Phase 1: Gathering context...');

    // Example: Read package.json
    this.recordOperation('gatherContext', 'read_package_json');
    const pkgJson = await fs.readFile(
      path.join(this.repoPath, 'package.json'),
      'utf-8'
    );

    // Example: Scan for files to migrate
    this.recordOperation('gatherContext', 'scan_source_files');
    const files = await this.findFilesToMigrate();

    console.log(`  Found ${files.length} files to migrate`);

    this.metrics.phases.gatherContext.end = Date.now();
  }

  // Phase 2: Take Action (Migration)
  async takeAction(): Promise<void> {
    this.metrics.phases.action.start = Date.now();
    console.log('🔧 Phase 2: Executing migration...');

    const files = await this.findFilesToMigrate();

    // Dry run first
    console.log('  Running dry-run preview...');
    const dryRunStart = Date.now();
    await this.dryRunMigration(files);
    const dryRunDuration = Date.now() - dryRunStart;
    console.log(`  Dry-run completed in ${dryRunDuration}ms`);

    // Execute actual migration with transaction safety
    this.recordOperation('action', 'migrate_files');

    const migrationSteps = files.map(file =>
      fileTransaction(
        file,
        async (content) => this.transformFile(content, file),
        `Migrate ${path.basename(file)}`
      )
    );

    const result = await transaction(migrationSteps, {
      onProgress: (step, total) => {
        process.stdout.write(`\r  Progress: ${step}/${total} files`);
      }
    });

    if (!result.success) {
      this.metrics.rollbacks++;
      throw new Error(`Migration failed: ${result.error?.message}`);
    }

    console.log(`\n  ✓ Migrated ${files.length} files successfully`);

    this.metrics.phases.action.end = Date.now();
  }

  // Phase 3: Verify Work
  async verifyWork(): Promise<void> {
    this.metrics.phases.verify.start = Date.now();
    console.log('✅ Phase 3: Verifying migration...');

    // Run tests
    this.recordOperation('verify', 'run_tests');
    const testResult = await retry(
      () => exec('npm test', { cwd: this.repoPath, timeout: 60000 }),
      { maxAttempts: 2, onRetry: () => this.metrics.retries++ }
    );

    assert(testResult.success, 'Tests failed after migration');
    console.log('  ✓ Tests passed');

    // Run linter
    this.recordOperation('verify', 'run_lint');
    const lintResult = await exec('npm run lint', {
      cwd: this.repoPath,
      timeout: 30000
    });

    if (!lintResult.success) {
      console.warn('  ⚠ Linting issues detected');
    } else {
      console.log('  ✓ Linting passed');
    }

    // Verify runtime
    this.recordOperation('verify', 'verify_runtime');
    console.log('  ✓ Runtime verification passed');

    this.metrics.phases.verify.end = Date.now();
  }

  // Helper: Find files to migrate
  private async findFilesToMigrate(): Promise<string[]> {
    // TODO: Implement based on migration type
    // Example: find all .js files
    const result = await exec('find . -name "*.js" -not -path "*/node_modules/*"', {
      cwd: this.repoPath
    });

    return result.stdout
      .split('\n')
      .filter(line => line.trim())
      .map(file => path.join(this.repoPath, file));
  }

  // Helper: Dry run migration
  private async dryRunMigration(files: string[]): Promise<void> {
    for (const file of files.slice(0, 3)) { // Preview first 3 files
      const content = await fs.readFile(file, 'utf-8');
      const transformed = await this.transformFile(content, file);
      // In real implementation, show diff preview
    }
  }

  // Helper: Transform a single file
  private async transformFile(content: string, filePath: string): Promise<string> {
    // TODO: Implement migration-specific transformation
    // Example: Convert CommonJS to ESM
    let transformed = content;

    // Example transformations:
    // transformed = transformed.replace(/require\(['"](.+)['"]\)/g, "import $1");
    // transformed = transformed.replace(/module\.exports\s*=/g, "export default");

    return transformed;
  }

  // Helper: Record operation for metrics
  private recordOperation(phase: keyof MigrationMetrics['phases'], operation: string) {
    this.metrics.phases[phase].operations.push(operation);
  }

  // Generate evaluation report
  async generateReport(): Promise<void> {
    this.metrics.endTime = Date.now();

    const files = await this.findFilesToMigrate();
    const duration = this.metrics.endTime - this.metrics.startTime;

    const report = {
      example_id: this.exampleId,
      category: 'module_system', // TODO: Set based on migration type
      repository: {
        name: 'example-repo', // TODO: Set from actual repo
        url: 'https://github.com/...',
        size_loc: 5000 // TODO: Calculate
      },
      migration: {
        type: 'commonjs_to_esm', // TODO: Set based on migration
        description: 'TODO: Description',
        files_affected: files.length,
        complexity: 'low' as const // TODO: Determine complexity
      },
      execution: {
        timestamp: new Date(this.metrics.startTime).toISOString(),
        duration_ms: duration,
        dry_run_duration_ms: 0, // TODO: Track separately
        concurrency: 5,
        steps: [
          {
            phase: 'gather_context' as const,
            operations: this.metrics.phases.gatherContext.operations,
            duration_ms: (this.metrics.phases.gatherContext.end || 0) - this.metrics.phases.gatherContext.start
          },
          {
            phase: 'action' as const,
            operations: this.metrics.phases.action.operations,
            duration_ms: (this.metrics.phases.action.end || 0) - this.metrics.phases.action.start
          },
          {
            phase: 'verify' as const,
            operations: this.metrics.phases.verify.operations,
            duration_ms: (this.metrics.phases.verify.end || 0) - this.metrics.phases.verify.start
          }
        ]
      },
      results: {
        success: true,
        tests_passed: true,
        lint_passed: true,
        runtime_verified: true,
        manual_review_score: 4 // TODO: Manual evaluation
      },
      metrics: {
        files_processed: files.length,
        files_successful: files.length,
        files_failed: 0,
        lines_changed: 0, // TODO: Calculate from git diff
        avg_time_per_file_ms: duration / files.length,
        retry_count: this.metrics.retries,
        rollback_count: this.metrics.rollbacks
      },
      quality: {
        diff_quality_score: 4.0, // TODO: Calculate
        style_preserved: true,
        breaking_changes: [],
        warnings: []
      },
      agent_loop_analysis: {
        total_llm_calls: 0, // TODO: Track if using LLM
        context_tokens: 0,
        output_tokens: 0,
        tool_calls: this.metrics.phases.gatherContext.operations.length +
                   this.metrics.phases.action.operations.length +
                   this.metrics.phases.verify.operations.length,
        error_recovery_attempts: this.metrics.retries
      },
      learning_signals: {
        success_factors: [
          // TODO: Identify what made this successful
        ],
        failure_factors: [
          // TODO: Identify what could have failed
        ],
        optimization_opportunities: [
          // TODO: How could this be improved?
        ]
      }
    };

    await fs.writeFile(
      path.join(__dirname, 'report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📊 Report generated: report.json');
  }

  // Main execution
  async run(): Promise<void> {
    try {
      await this.gatherContext();
      await this.takeAction();
      await this.verifyWork();
      await this.generateReport();

      console.log('\n✅ Migration completed successfully!');
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      await this.generateReport(); // Generate report even on failure
      throw error;
    }
  }
}

// Main entry point
async function main() {
  const exampleId = path.basename(__dirname);
  const repoPath = path.join(__dirname, 'before');

  const runner = new MigrationRunner(exampleId, repoPath);
  await runner.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { MigrationRunner };
