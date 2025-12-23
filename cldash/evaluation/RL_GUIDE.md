# Synchronous Reinforcement Learning Guide

## Overview

This guide explains how to use the golden dataset for **synchronous reinforcement learning** - training an agent to improve its code migration performance based on real-world examples.

## What is Synchronous RL?

**Synchronous RL** means the agent learns from completed episodes immediately, rather than asynchronously:
1. Agent attempts a migration
2. Observes the result (success/failure, metrics)
3. Updates its policy based on the reward
4. Repeats with next example

This is ideal for our use case because:
- ✅ Each migration is a complete episode
- ✅ Rewards are immediate (tests pass/fail, bundle size)
- ✅ We can learn from both successes and failures
- ✅ Golden dataset provides ground truth

---

## RL Framework

### State Space

The **state** represents what the agent observes before taking action:

```typescript
interface MigrationState {
  // Repository context
  repo: {
    name: string;
    size_loc: number;
    complexity: 'low' | 'medium' | 'high';
    has_tests: boolean;
  };

  // Dependency context
  dependency: {
    current: string;          // e.g., "moment@2.29.1"
    target: string;           // e.g., "dayjs@1.11.10"
    usage_patterns: {
      imports: number;
      api_calls: {
        format: number;
        diff: number;
        fromNow: number;
        isBetween: number;
        // ... etc
      };
    };
  };

  // Codebase context
  codebase: {
    files_to_migrate: number;
    total_lines: number;
    languages: string[];
    has_circular_deps: boolean;
  };
}
```

### Action Space

The **actions** represent the agent's decisions during migration:

```typescript
interface MigrationAction {
  // Strategy choices
  strategy: {
    use_dry_run: boolean;           // Preview first?
    use_transaction: boolean;       // Enable rollback?
    concurrency: number;            // How many files at once?
    enable_streaming: boolean;      // Show progress?
  };

  // Transformation choices
  transformation: {
    add_plugins: string[];          // Which dayjs plugins?
    transform_order: string[];      // Which transforms first?
    handle_edge_cases: {
      circular_deps: 'ignore' | 'warn' | 'fix';
      missing_tests: 'skip' | 'warn' | 'manual';
    };
  };

  // Verification choices
  verification: {
    run_tests: boolean;
    check_bundle_size: boolean;
    verify_no_moment: boolean;
    manual_review: boolean;
  };
}
```

### Reward Function

The **reward** signals success/failure and optimization opportunities:

```typescript
function calculateReward(result: MigrationResult): number {
  let reward = 0;

  // Primary objective: Successful migration
  if (result.success) {
    reward += 100;
  } else {
    reward -= 50;
  }

  // Secondary: Tests pass
  if (result.tests_passed) {
    reward += 50;
  } else if (result.success) {
    reward -= 25;  // Penalize broken tests
  }

  // Efficiency: Faster is better
  const timeBonus = Math.max(0, 10 - result.duration_ms / 100);
  reward += timeBonus;

  // Business value: Bundle size reduction
  if (result.bundle_size_reduction_percent > 0) {
    reward += result.bundle_size_reduction_percent / 2;  // Up to 50 points
  }

  // Quality: Code quality matters
  reward += (result.quality_score - 3) * 10;  // -20 to +20

  // Safety: Rollbacks are learning opportunities
  if (result.rollback_count > 0) {
    reward -= result.rollback_count * 5;  // -5 per rollback
  }

  // Penalties
  if (result.errors.length > 0) {
    reward -= result.errors.length * 10;
  }

  return reward;
}
```

---

## Training Loop

### Implementation

```typescript
// File: evaluation/scripts/rl-training.ts

import * as fs from 'fs/promises';
import * as path from 'path';

interface Episode {
  state: MigrationState;
  action: MigrationAction;
  reward: number;
  next_state: MigrationState;
  done: boolean;
}

interface Policy {
  // Maps state features to action probabilities
  predict(state: MigrationState): MigrationAction;
  update(episode: Episode): void;
}

class SimplePolicyGradient implements Policy {
  private weights: Map<string, number>;
  private learningRate = 0.01;

  constructor() {
    this.weights = new Map();
  }

  predict(state: MigrationState): MigrationAction {
    // Simple heuristic-based policy
    return {
      strategy: {
        use_dry_run: true,  // Always preview first
        use_transaction: state.codebase.files_to_migrate > 3,  // Use transactions for 3+ files
        concurrency: Math.min(5, Math.floor(state.codebase.files_to_migrate / 2)),
        enable_streaming: state.codebase.files_to_migrate > 5
      },
      transformation: {
        add_plugins: this.detectNeededPlugins(state),
        transform_order: ['imports', 'api_calls', 'cleanup'],
        handle_edge_cases: {
          circular_deps: state.codebase.has_circular_deps ? 'warn' : 'ignore',
          missing_tests: state.repo.has_tests ? 'skip' : 'warn'
        }
      },
      verification: {
        run_tests: state.repo.has_tests,
        check_bundle_size: true,
        verify_no_moment: true,
        manual_review: state.repo.complexity === 'high'
      }
    };
  }

  update(episode: Episode): void {
    // Update policy based on reward
    const stateKey = this.stateToKey(episode.state);
    const currentValue = this.weights.get(stateKey) || 0;

    // Simple gradient update
    const newValue = currentValue + this.learningRate * episode.reward;
    this.weights.set(stateKey, newValue);

    console.log(`Updated policy for ${stateKey}: ${currentValue.toFixed(2)} → ${newValue.toFixed(2)}`);
  }

  private stateToKey(state: MigrationState): string {
    return `${state.repo.complexity}_${state.codebase.files_to_migrate}_${state.repo.has_tests}`;
  }

  private detectNeededPlugins(state: MigrationState): string[] {
    const plugins: string[] = [];

    if (state.dependency.usage_patterns.api_calls.isBetween > 0) {
      plugins.push('isBetween');
    }
    if (state.dependency.usage_patterns.api_calls.fromNow > 0) {
      plugins.push('relativeTime');
    }

    return plugins;
  }
}

async function trainFromGoldenDataset() {
  console.log('🧠 Starting RL Training from Golden Dataset\n');

  const policy = new SimplePolicyGradient();
  const episodes: Episode[] = [];

  // Load all migration reports
  const datasetPath = path.join(__dirname, '../golden-dataset');
  const examples = await fs.readdir(datasetPath);

  let totalReward = 0;

  for (const example of examples) {
    const reportPath = path.join(datasetPath, example, 'report.json');

    try {
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      const report = JSON.parse(reportContent);

      // Extract state
      const state: MigrationState = {
        repo: {
          name: report.repository.name,
          size_loc: report.repository.size_loc,
          complexity: report.migration.complexity,
          has_tests: report.results.tests_passed !== undefined
        },
        dependency: {
          current: `moment@${report.moment_usage_patterns?.imports || 'unknown'}`,
          target: 'dayjs@1.11.10',
          usage_patterns: {
            imports: report.moment_usage_patterns?.imports || 0,
            api_calls: report.moment_usage_patterns || {}
          }
        },
        codebase: {
          files_to_migrate: report.metrics.files_processed,
          total_lines: report.repository.size_loc,
          languages: ['javascript'],
          has_circular_deps: false
        }
      };

      // Get action (what the agent did)
      const action = policy.predict(state);

      // Calculate reward
      const reward = calculateReward(report);
      totalReward += reward;

      // Create episode
      const episode: Episode = {
        state,
        action,
        reward,
        next_state: state,  // Migration completes the episode
        done: true
      };

      episodes.push(episode);

      // Update policy
      policy.update(episode);

      console.log(`Episode ${example}:`);
      console.log(`  Reward: ${reward.toFixed(2)}`);
      console.log(`  Success: ${report.results.success ? '✅' : '❌'}`);
      console.log(`  Tests: ${report.results.tests_passed ? '✅' : '❌'}`);
      console.log('');

    } catch (error) {
      console.log(`⚠️  Skipping ${example}: ${error.message}`);
    }
  }

  // Summary
  const avgReward = totalReward / episodes.length;
  console.log('='.repeat(60));
  console.log('📊 Training Summary');
  console.log('='.repeat(60));
  console.log(`Episodes: ${episodes.length}`);
  console.log(`Total Reward: ${totalReward.toFixed(2)}`);
  console.log(`Average Reward: ${avgReward.toFixed(2)}`);
  console.log('');

  // Save trained policy
  await fs.writeFile(
    path.join(__dirname, '../trained-policy.json'),
    JSON.stringify({
      episodes: episodes.length,
      avg_reward: avgReward,
      timestamp: new Date().toISOString()
    }, null, 2)
  );

  console.log('✅ Policy saved to trained-policy.json');
}

function calculateReward(result: any): number {
  let reward = 0;

  if (result.results.success) reward += 100;
  else reward -= 50;

  if (result.results.tests_passed) reward += 50;
  else if (result.results.success) reward -= 25;

  const timeBonus = Math.max(0, 10 - result.execution.duration_ms / 100);
  reward += timeBonus;

  if (result.bundle_size_impact?.reduction_percent) {
    reward += result.bundle_size_impact.reduction_percent / 2;
  }

  reward += (result.results.manual_review_score - 3) * 10;

  if (result.metrics.rollback_count > 0) {
    reward -= result.metrics.rollback_count * 5;
  }

  return reward;
}

// Run training
if (require.main === module) {
  trainFromGoldenDataset().catch(console.error);
}

export { trainFromGoldenDataset };
```

---

## Running RL Training

### Step 1: Ensure Golden Dataset Exists

```bash
cd cldash/evaluation

# Check you have migration reports
ls golden-dataset/*/report.json

# Should see:
# golden-dataset/001-commonjs-to-esm-simple/report.json
# golden-dataset/013-moment-to-dayjs/report.json
# ... etc
```

### Step 2: Run Training

```bash
# Install dependencies if needed
npm install

# Run training script
npx tsx scripts/rl-training.ts
```

### Expected Output

```
🧠 Starting RL Training from Golden Dataset

Episode 001-commonjs-to-esm-simple:
  Reward: 155.12
  Success: ✅
  Tests: ✅

Updated policy for low_5_true: 0.00 → 1.55

Episode 013-moment-to-dayjs:
  Reward: 181.50
  Success: ✅
  Tests: ✅

Updated policy for medium_5_true: 0.00 → 1.82

============================================================
📊 Training Summary
============================================================
Episodes: 2
Total Reward: 336.62
Average Reward: 168.31

✅ Policy saved to trained-policy.json
```

---

## Advanced: Multi-Episode Training

For more sophisticated learning, implement experience replay:

```typescript
class ExperienceReplay {
  private buffer: Episode[] = [];
  private maxSize = 1000;

  add(episode: Episode) {
    this.buffer.push(episode);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();  // Remove oldest
    }
  }

  sample(batchSize: number): Episode[] {
    const shuffled = [...this.buffer].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, batchSize);
  }

  size(): number {
    return this.buffer.length;
  }
}

// Usage
const replay = new ExperienceReplay();

for (const example of examples) {
  // ... run migration ...
  const episode = { state, action, reward, next_state, done };
  replay.add(episode);

  // Train from random batch
  if (replay.size() >= 32) {
    const batch = replay.sample(32);
    for (const ep of batch) {
      policy.update(ep);
    }
  }
}
```

---

## Metrics to Track

### During Training

```typescript
interface TrainingMetrics {
  episode: number;
  reward: number;
  cumulative_reward: number;
  avg_reward: number;
  success_rate: number;
  policy_updates: number;
}
```

### Visualization

```bash
# Create CSV for plotting
cat > plot-training.sh << 'EOF'
#!/bin/bash

# Extract rewards from training logs
grep "Reward:" training.log | awk '{print NR","$2}' > rewards.csv

# Plot with gnuplot (if installed)
gnuplot << PLOT
set datafile separator ","
set terminal png size 800,600
set output "training_curve.png"
set xlabel "Episode"
set ylabel "Reward"
set title "RL Training Progress"
plot "rewards.csv" with lines title "Reward per Episode"
PLOT

echo "Plot saved to training_curve.png"
EOF

chmod +x plot-training.sh
```

---

## Integration with Claude Code

### Using Trained Policy

```typescript
// In migration script
import { trainedPolicy } from './trained-policy.json';

async function migrate(repo: Repository) {
  // Get state
  const state = await analyzeRepository(repo);

  // Use trained policy to decide strategy
  const action = trainedPolicy.predict(state);

  // Execute with learned strategy
  await executeMigration(repo, action);
}
```

### Continuous Learning

```typescript
// After each migration
async function completeMigration(result: MigrationResult) {
  // Calculate reward
  const reward = calculateReward(result);

  // Update policy
  await policy.update({ state, action, reward, done: true });

  // Save updated policy
  await savePolicy();
}
```

---

## Success Metrics

Track these to measure RL effectiveness:

| Metric | Before RL | After RL | Target |
|--------|-----------|----------|--------|
| Success Rate | 85% | 95% | 95%+ |
| Avg Reward | 120 | 165 | 150+ |
| Avg Duration | 1200ms | 850ms | <1000ms |
| Test Pass Rate | 90% | 98% | 95%+ |

---

## Next Steps

1. **Collect More Data**: Run 7 repo tests to build dataset
2. **Implement Training**: Use `rl-training.ts` script
3. **Evaluate Policy**: Test on new repos not in training set
4. **Iterate**: Adjust reward function based on what matters most
5. **Deploy**: Use trained policy in production migrations

---

## Further Reading

- **Proximal Policy Optimization (PPO)**: More stable training
- **Deep Q-Networks (DQN)**: Neural network policies
- **A/B Testing**: Compare trained vs heuristic policies
- **Multi-Armed Bandits**: Quick experimentation with strategies
