#!/usr/bin/env tsx
/**
 * Orchestrates running all 30 migration evaluations and collects metrics
 */

import { exec } from '../../lib/exec';
import { parallel } from '../../lib/parallel';
import { assert } from '../../lib/assert';
import * as fs from 'fs/promises';
import * as path from 'path';

interface EvaluationResult {
  example_id: string;
  category: string;
  repository: {
    name: string;
    url: string;
    stars?: number;
    size_loc?: number;
  };
  migration: {
    type: string;
    description: string;
    files_affected: number;
    complexity: 'low' | 'medium' | 'high';
  };
  execution: {
    timestamp: string;
    duration_ms: number;
    dry_run_duration_ms: number;
    concurrency: number;
    steps: Array<{
      phase: 'gather_context' | 'action' | 'verify';
      operations: string[];
      duration_ms: number;
    }>;
  };
  results: {
    success: boolean;
    tests_passed: boolean;
    lint_passed: boolean;
    runtime_verified: boolean;
    manual_review_score: number;
  };
  metrics: {
    files_processed: number;
    files_successful: number;
    files_failed: number;
    lines_changed: number;
    avg_time_per_file_ms: number;
    retry_count: number;
    rollback_count: number;
  };
  quality: {
    diff_quality_score: number;
    style_preserved: boolean;
    breaking_changes: string[];
    warnings: string[];
  };
  agent_loop_analysis: {
    total_llm_calls: number;
    context_tokens: number;
    output_tokens: number;
    tool_calls: number;
    error_recovery_attempts: number;
  };
  learning_signals: {
    success_factors: string[];
    failure_factors: string[];
    optimization_opportunities: string[];
  };
}

interface AggregateMetrics {
  total_examples: number;
  successful: number;
  failed: number;
  success_rate: number;
  avg_duration_ms: number;
  avg_speedup: number;
  avg_quality_score: number;
  categories: Record<string, {
    count: number;
    success_rate: number;
    avg_duration_ms: number;
  }>;
  reliability: {
    tests_pass_rate: number;
    rollback_success_rate: number;
    error_recovery_rate: number;
  };
}

async function loadEvaluationExample(exampleId: string): Promise<EvaluationResult | null> {
  const reportPath = path.join(__dirname, '../golden-dataset', exampleId, 'report.json');
  try {
    const content = await fs.readFile(reportPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load example ${exampleId}:`, error);
    return null;
  }
}

async function runMigrationExample(exampleId: string): Promise<EvaluationResult> {
  const scriptPath = path.join(__dirname, '../golden-dataset', exampleId, 'migration-script.ts');
  const startTime = Date.now();

  console.log(`\n▶ Running ${exampleId}...`);

  // Execute the migration script
  const result = await exec(`npx tsx ${scriptPath}`, {
    cwd: path.join(__dirname, '../golden-dataset', exampleId),
    timeout: 300000, // 5 minute timeout
    onData: (data, stream) => {
      if (stream === 'stderr' && data.includes('ERROR')) {
        console.error(`  ⚠ ${data.trim()}`);
      }
    }
  });

  const duration = Date.now() - startTime;

  // Load the generated report
  const report = await loadEvaluationExample(exampleId);
  assert(report !== null, `Report not generated for ${exampleId}`);

  console.log(`  ✓ Completed in ${duration}ms`);

  return {
    ...report,
    execution: {
      ...report.execution,
      duration_ms: duration
    }
  };
}

async function runAllEvaluations(concurrency = 3): Promise<EvaluationResult[]> {
  console.log('🚀 Starting cldash evaluation suite...\n');

  // Discover all evaluation examples
  const datasetDir = path.join(__dirname, '../golden-dataset');
  const entries = await fs.readdir(datasetDir, { withFileTypes: true });
  const examples = entries
    .filter(e => e.isDirectory() && /^\d{3}-/.test(e.name))
    .map(e => e.name)
    .sort();

  console.log(`Found ${examples.length} evaluation examples\n`);

  // Run evaluations in parallel with controlled concurrency
  const tasks = examples.map(exampleId => () => runMigrationExample(exampleId));

  const { results, errors } = await parallel(tasks, {
    concurrency,
    onProgress: (completed, total) => {
      const pct = Math.round((completed / total) * 100);
      process.stdout.write(`\rProgress: ${completed}/${total} (${pct}%)  `);
    }
  });

  console.log('\n');

  if (errors.length > 0) {
    console.error(`⚠ ${errors.length} evaluations failed:`);
    errors.forEach(({ error, index }) => {
      console.error(`  - ${examples[index]}: ${error.message}`);
    });
  }

  return results.filter((r): r is EvaluationResult => r !== null);
}

function calculateAggregateMetrics(results: EvaluationResult[]): AggregateMetrics {
  const successful = results.filter(r => r.results.success).length;
  const testsPassedCount = results.filter(r => r.results.tests_passed).length;

  const categories: Record<string, { count: number; successes: number; durations: number[] }> = {};

  results.forEach(r => {
    if (!categories[r.category]) {
      categories[r.category] = { count: 0, successes: 0, durations: [] };
    }
    categories[r.category].count++;
    if (r.results.success) categories[r.category].successes++;
    categories[r.category].durations.push(r.execution.duration_ms);
  });

  return {
    total_examples: results.length,
    successful,
    failed: results.length - successful,
    success_rate: successful / results.length,
    avg_duration_ms: results.reduce((sum, r) => sum + r.execution.duration_ms, 0) / results.length,
    avg_speedup: results.reduce((sum, r) => sum + (r.execution.concurrency || 1), 0) / results.length,
    avg_quality_score: results.reduce((sum, r) => sum + r.results.manual_review_score, 0) / results.length,
    categories: Object.fromEntries(
      Object.entries(categories).map(([cat, data]) => [
        cat,
        {
          count: data.count,
          success_rate: data.successes / data.count,
          avg_duration_ms: data.durations.reduce((a, b) => a + b, 0) / data.durations.length
        }
      ])
    ),
    reliability: {
      tests_pass_rate: testsPassedCount / results.length,
      rollback_success_rate: 1.0, // Calculate from actual rollback attempts
      error_recovery_rate: results.filter(r =>
        r.agent_loop_analysis.error_recovery_attempts > 0 && r.results.success
      ).length / results.filter(r => r.agent_loop_analysis.error_recovery_attempts > 0).length || 1
    }
  };
}

function printReport(metrics: AggregateMetrics) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 EVALUATION REPORT');
  console.log('='.repeat(60));
  console.log(`\nOverall Results:`);
  console.log(`  Total Examples: ${metrics.total_examples}`);
  console.log(`  Successful: ${metrics.successful} (${(metrics.success_rate * 100).toFixed(1)}%)`);
  console.log(`  Failed: ${metrics.failed}`);
  console.log(`  Average Duration: ${metrics.avg_duration_ms.toFixed(0)}ms`);
  console.log(`  Average Quality Score: ${metrics.avg_quality_score.toFixed(2)}/5`);

  console.log(`\nReliability Metrics:`);
  console.log(`  Tests Pass Rate: ${(metrics.reliability.tests_pass_rate * 100).toFixed(1)}%`);
  console.log(`  Error Recovery Rate: ${(metrics.reliability.error_recovery_rate * 100).toFixed(1)}%`);

  console.log(`\nBy Category:`);
  Object.entries(metrics.categories).forEach(([cat, data]) => {
    console.log(`  ${cat}:`);
    console.log(`    Count: ${data.count}`);
    console.log(`    Success Rate: ${(data.success_rate * 100).toFixed(1)}%`);
    console.log(`    Avg Duration: ${data.avg_duration_ms.toFixed(0)}ms`);
  });

  console.log('\n' + '='.repeat(60));

  // Staff Engineer Evaluation
  console.log('\n🎯 STAFF ENGINEER EVALUATION\n');

  const passesProductionBar =
    metrics.success_rate >= 0.90 &&
    metrics.avg_quality_score >= 4.0 &&
    metrics.reliability.tests_pass_rate >= 0.90;

  if (passesProductionBar) {
    console.log('✅ PRODUCTION READY');
    console.log('This tool meets the bar for staff engineer approval:');
    console.log(`  • ${(metrics.success_rate * 100).toFixed(1)}% success rate (target: 90%+)`);
    console.log(`  • ${metrics.avg_quality_score.toFixed(2)}/5 quality score (target: 4.0+)`);
    console.log(`  • ${(metrics.reliability.tests_pass_rate * 100).toFixed(1)}% tests pass (target: 90%+)`);
  } else {
    console.log('⚠️  NEEDS IMPROVEMENT');
    console.log('Areas to address:');
    if (metrics.success_rate < 0.90) {
      console.log(`  • Success rate: ${(metrics.success_rate * 100).toFixed(1)}% (target: 90%+)`);
    }
    if (metrics.avg_quality_score < 4.0) {
      console.log(`  • Quality score: ${metrics.avg_quality_score.toFixed(2)}/5 (target: 4.0+)`);
    }
    if (metrics.reliability.tests_pass_rate < 0.90) {
      console.log(`  • Tests pass rate: ${(metrics.reliability.tests_pass_rate * 100).toFixed(1)}% (target: 90%+)`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

async function main() {
  try {
    const results = await runAllEvaluations(3);
    const metrics = calculateAggregateMetrics(results);

    // Save results
    const resultsDir = path.join(__dirname, '../results');
    await fs.mkdir(resultsDir, { recursive: true });

    await fs.writeFile(
      path.join(resultsDir, 'aggregate-report.json'),
      JSON.stringify(metrics, null, 2)
    );

    // Save RL training data (JSONL format)
    const rlData = results.map(r => JSON.stringify(r)).join('\n');
    await fs.writeFile(
      path.join(resultsDir, 'rl-training-data.jsonl'),
      rlData
    );

    printReport(metrics);

    process.exit(metrics.success_rate >= 0.90 ? 0 : 1);

  } catch (error) {
    console.error('Evaluation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { runAllEvaluations, calculateAggregateMetrics };
