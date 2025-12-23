/**
 * cldash Demo - Test Workflow Agent
 *
 * This demo shows how cldash utilities make agent workflows more reliable.
 * The agent runs a test suite, retries on flakiness, and verifies results.
 */

import { exec, assert, retry, pipe } from './lib';

async function main() {
  console.log('🚀 cldash Demo: Test Workflow\n');

  // 1. EXEC - Structured command execution
  console.log('1️⃣  Testing exec() - structured bash execution\n');

  const lsResult = await exec('ls -la');
  console.log('✓ Command:', lsResult.command);
  console.log('✓ Success:', lsResult.success);
  console.log('✓ Exit code:', lsResult.exitCode);
  console.log('✓ Duration:', lsResult.duration, 'ms');
  console.log('✓ Output length:', lsResult.stdout.length, 'chars\n');

  // 2. ASSERT - Explicit verification
  console.log('2️⃣  Testing assert() - agent self-verification\n');

  try {
    assert(lsResult.success, 'ls command must succeed');
    console.log('✓ Assertion passed: ls succeeded\n');
  } catch (error) {
    console.error('✗ Assertion failed:', error);
  }

  // 3. RETRY - Resilient operations
  console.log('3️⃣  Testing retry() - handling flaky operations\n');

  let attemptCount = 0;
  const flakyOperation = async () => {
    attemptCount++;
    console.log(`   Attempt ${attemptCount}...`);

    // Simulate flaky test that fails first 2 times
    if (attemptCount < 3) {
      throw new Error('Simulated failure');
    }
    return { success: true, data: 'Test passed!' };
  };

  const retryResult = await retry(flakyOperation, {
    attempts: 5,
    backoff: 100,
    onRetry: (attempt, error) => {
      console.log(`   ⚠️  Retry ${attempt}: ${error.message}`);
    },
  });

  console.log('✓ Operation succeeded:', retryResult.data);
  console.log('✓ Total attempts:', attemptCount, '\n');

  // 4. PIPE - Workflow composition
  console.log('4️⃣  Testing pipe() - composing workflows\n');

  const workflow = pipe(
    (file: string) => {
      console.log('   Step 1: Reading file ->', file);
      return `content-of-${file}`;
    },
    (content: string) => {
      console.log('   Step 2: Processing ->', content);
      return content.toUpperCase();
    },
    (processed: string) => {
      console.log('   Step 3: Validating ->', processed);
      return { valid: true, data: processed };
    }
  );

  const pipeResult = workflow('test.txt');
  console.log('✓ Pipeline result:', pipeResult, '\n');

  // 5. REAL-WORLD EXAMPLE - Test runner workflow
  console.log('5️⃣  Real-world example: Test runner workflow\n');

  const runTestWorkflow = async () => {
    // Check if we're in a git repo
    const gitCheck = await exec('git rev-parse --is-inside-work-tree', {
      timeout: 5000,
    });

    assert(gitCheck.success, 'Must be in a git repository');
    console.log('✓ Git repository verified');

    // Get current branch
    const branchResult = await exec('git branch --show-current');
    console.log('✓ Current branch:', branchResult.stdout);

    // Check git status
    const statusResult = await exec('git status --porcelain');
    const hasChanges = statusResult.stdout.length > 0;
    console.log('✓ Working tree has changes:', hasChanges);

    return {
      inGitRepo: true,
      branch: branchResult.stdout,
      hasChanges,
    };
  };

  try {
    const workflowResult = await retry(runTestWorkflow, {
      attempts: 3,
      backoff: 1000,
    });

    console.log('\n✅ Complete workflow result:', workflowResult);
  } catch (error: any) {
    console.error('\n❌ Workflow failed:', error.message);
  }

  console.log('\n🎉 Demo complete!');
  console.log('\nKey benefits of cldash:');
  console.log('  • exec() provides structured output agents can parse');
  console.log('  • assert() makes verification explicit and debuggable');
  console.log('  • retry() handles flaky operations automatically');
  console.log('  • pipe() enables readable workflow composition');
}

main().catch(console.error);
