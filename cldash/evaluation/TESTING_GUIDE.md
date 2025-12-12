# Manual Testing Guide for 7 Real Repositories

## Overview

This guide walks through testing the moment.js → Day.js migration on all 7 validated repositories to build a comprehensive golden dataset.

## Prerequisites

```bash
cd /Users/shambhavi/Documents/projects/claude-agent-sdk-demos/cldash/evaluation
```

## Testing Workflow (Per Repository)

### Step 1: Clone Repository

```bash
# Example for repo 1
cd golden-dataset
mkdir -p 014-react-datetime
cd 014-react-datetime

# Clone the repo
git clone https://github.com/arqex/react-datetime.git before
cd before
```

### Step 2: Verify It Uses moment.js

```bash
# Check package.json
cat package.json | jq '{
  name,
  version,
  moment: (.dependencies.moment // .peerDependencies.moment // .devDependencies.moment),
  test_script: .scripts.test
}'

# Should show moment version and test script
```

### Step 3: Install & Test (Baseline)

```bash
# Install dependencies
npm install

# Run tests to establish baseline
npm test 2>&1 | tee baseline-tests.log

# Measure bundle size
du -sh node_modules > baseline-bundle.txt
```

### Step 4: Create Migration Script

```bash
cd ..  # Back to 014-react-datetime/

# Copy template
cp ../scripts/migration-template.ts migration-script.ts

# Edit migration-script.ts to customize for this repo
# Key sections to update:
# 1. Repository details (name, category, complexity)
# 2. File scanning patterns (if different from *.js)
# 3. Any repo-specific transformations
```

### Step 5: Run Migration

```bash
# Execute migration
npx tsx migration-script.ts

# This will:
# - Copy before/ to after/
# - Run the migration
# - Generate report.json
# - Show results
```

### Step 6: Verify Results

```bash
cd after/

# Check that moment is replaced
cat package.json | jq '.dependencies'

# Should show dayjs instead of moment

# Run tests
npm test 2>&1 | tee ../test-results.log

# Compare bundle size
du -sh node_modules > ../after-bundle.txt
```

### Step 7: Document Results

```bash
cd ..  # Back to 014-react-datetime/

# Create analysis document
cat > ANALYSIS.md << 'EOF'
# Migration Analysis: [Repo Name]

## Repository Info
- **Name**: [name]
- **Stars**: [stars]
- **Category**: [category]
- **Complexity**: [complexity]

## Migration Results

### Success Metrics
- ✅/❌ Migration completed
- ✅/❌ Tests passed
- ✅/❌ No moment.js remaining

### Performance Metrics
- Execution time: [X]ms
- Files processed: [N]
- API calls migrated: [N]

### Bundle Size Impact
- Before: [X]KB
- After: [X]KB
- Reduction: [X]KB ([X]%)

## Issues Encountered
[List any issues, edge cases, or manual fixes needed]

## Learning Signals

### Success Factors
- [What made this migration succeed?]

### Challenges
- [What was difficult?]

### Optimizations
- [How could this be improved?]
EOF
```

---

## Quick Test Script (Automates Steps 1-7)

Create this helper script for faster testing:

```bash
cat > test-repo.sh << 'EOF'
#!/bin/bash
# Usage: ./test-repo.sh <owner/repo> <example-number> <complexity>
# Example: ./test-repo.sh arqex/react-datetime 014 low

REPO_FULL=$1
EXAMPLE_NUM=$2
COMPLEXITY=$3
EXAMPLE_ID="${EXAMPLE_NUM}-$(echo $REPO_FULL | cut -d'/' -f2)"

echo "🧪 Testing $REPO_FULL as example $EXAMPLE_ID"

# Step 1: Setup
mkdir -p "golden-dataset/$EXAMPLE_ID"
cd "golden-dataset/$EXAMPLE_ID"

# Step 2: Clone
echo "📥 Cloning repository..."
git clone --depth 1 "https://github.com/$REPO_FULL.git" before
cd before

# Step 3: Verify moment.js
echo "🔍 Verifying moment.js usage..."
MOMENT_VERSION=$(cat package.json | jq -r '.dependencies.moment // .peerDependencies.moment // .devDependencies.moment // "not found"')

if [ "$MOMENT_VERSION" = "not found" ]; then
  echo "❌ No moment.js found in this repo"
  exit 1
fi

echo "✅ Found moment.js version: $MOMENT_VERSION"

# Step 4: Install & baseline test
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps 2>&1 | tail -5

echo "🧪 Running baseline tests..."
TEST_SCRIPT=$(cat package.json | jq -r '.scripts.test // "echo No tests"')
if [ "$TEST_SCRIPT" != "echo No tests" ]; then
  timeout 120 npm test 2>&1 | tee ../baseline-tests.log || echo "⚠️  Baseline tests failed or timed out"
else
  echo "⚠️  No test script found"
fi

# Step 5: Measure baseline
du -sh node_modules > ../baseline-bundle.txt
cd ..

# Step 6: Create migration script
echo "📝 Creating migration script..."
cat > migration-script.ts << 'MIGRATION_EOF'
#!/usr/bin/env tsx
import { exec } from '../../lib/exec';
import { transaction, fileTransaction } from '../../lib/transaction';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';

async function migrate() {
  const repoPath = path.join(__dirname, 'after');

  // Copy before to after
  await exec(`rm -rf after && cp -r before after`);

  // Find JS files
  const files = glob.sync('**/*.{js,jsx}', {
    cwd: repoPath,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  });

  console.log(`Found ${files.length} files to migrate`);

  // Transform files
  const steps = files.map(file =>
    fileTransaction(file, async (content) => {
      let transformed = content;

      // Transform imports
      transformed = transformed.replace(
        /import\s+moment\s+from\s+['"]moment['"]/g,
        "import dayjs from 'dayjs'"
      );

      // Add plugins if needed
      const needsIsBetween = transformed.includes('.isBetween(');
      const needsRelativeTime = transformed.includes('.fromNow(');

      if (needsIsBetween || needsRelativeTime) {
        let plugins = "import dayjs from 'dayjs';\n";
        if (needsIsBetween) plugins += "import isBetweenPlugin from 'dayjs/plugin/isBetween.js';\n";
        if (needsRelativeTime) plugins += "import relativeTimePlugin from 'dayjs/plugin/relativeTime.js';\n";
        if (needsIsBetween) plugins += "dayjs.extend(isBetweenPlugin);\n";
        if (needsRelativeTime) plugins += "dayjs.extend(relativeTimePlugin);\n";

        transformed = transformed.replace(
          /(import dayjs from 'dayjs';?)/,
          plugins
        );
      }

      // Transform API calls
      transformed = transformed.replace(/\bmoment\(/g, 'dayjs(');

      return transformed;
    })
  );

  await transaction(steps);

  // Update package.json
  const pkgPath = path.join(repoPath, 'package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));

  delete pkg.dependencies?.moment;
  delete pkg.peerDependencies?.moment;
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies.dayjs = '^1.11.10';

  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2));

  console.log('✅ Migration complete');

  // Install dayjs
  await exec('npm install dayjs --legacy-peer-deps', { cwd: repoPath });
}

migrate().catch(console.error);
MIGRATION_EOF

# Step 7: Run migration
echo "🔄 Running migration..."
npx tsx migration-script.ts

# Step 8: Test migrated version
cd after
echo "🧪 Testing migrated version..."
if [ "$TEST_SCRIPT" != "echo No tests" ]; then
  timeout 120 npm test 2>&1 | tee ../after-tests.log || echo "⚠️  Post-migration tests failed or timed out"
fi

# Step 9: Measure after
du -sh node_modules > ../after-bundle.txt
cd ..

# Step 10: Generate summary
echo ""
echo "===================="
echo "📊 MIGRATION SUMMARY"
echo "===================="
echo ""
echo "Repository: $REPO_FULL"
echo "Example ID: $EXAMPLE_ID"
echo ""

BEFORE_SIZE=$(cat baseline-bundle.txt | awk '{print $1}')
AFTER_SIZE=$(cat after-bundle.txt | awk '{print $1}')
echo "Bundle Size:"
echo "  Before: $BEFORE_SIZE"
echo "  After:  $AFTER_SIZE"

echo ""
echo "Tests:"
if [ "$TEST_SCRIPT" != "echo No tests" ]; then
  BASELINE_RESULT=$(tail -1 baseline-tests.log | grep -q "passed" && echo "✅ PASSED" || echo "❌ FAILED")
  AFTER_RESULT=$(tail -1 after-tests.log | grep -q "passed" && echo "✅ PASSED" || echo "❌ FAILED")
  echo "  Baseline: $BASELINE_RESULT"
  echo "  After:    $AFTER_RESULT"
else
  echo "  No tests available"
fi

echo ""
echo "Next: Review logs in golden-dataset/$EXAMPLE_ID/"
echo "===================="

EOF

chmod +x test-repo.sh
```

---

## Testing All 7 Repositories

Run these commands in sequence:

```bash
# 1. react-datetime (LOW complexity, has tests)
./test-repo.sh arqex/react-datetime 014 low

# 2. input-moment (LOW complexity, has tests)
./test-repo.sh wangzuo/input-moment 015 low

# 3. ecommerce-react (MEDIUM complexity, has tests)
./test-repo.sh jgudo/ecommerce-react 016 medium

# 4. CLNDR (MEDIUM complexity, no tests)
./test-repo.sh kylestetz/CLNDR 017 medium

# 5. rome (MEDIUM complexity, no tests)
./test-repo.sh bevacqua/rome 018 medium

# 6. sound-redux (MEDIUM complexity, no tests)
./test-repo.sh andrewngu/sound-redux 019 medium

# 7. keystone-classic (HIGH complexity, has tests)
./test-repo.sh keystonejs/keystone-classic 020 high
```

---

## Collecting Aggregate Metrics

After testing all repos:

```bash
# Generate aggregate report
cat > collect-results.sh << 'EOF'
#!/bin/bash

echo "# Aggregate Results" > AGGREGATE_RESULTS.md
echo "" >> AGGREGATE_RESULTS.md

TOTAL=0
SUCCESS=0
TESTS_PASSED=0
TOTAL_BEFORE=0
TOTAL_AFTER=0

for dir in golden-dataset/*/; do
  if [ -f "$dir/report.json" ]; then
    TOTAL=$((TOTAL + 1))

    SUCCESS_FLAG=$(cat "$dir/report.json" | jq -r '.results.success')
    if [ "$SUCCESS_FLAG" = "true" ]; then
      SUCCESS=$((SUCCESS + 1))
    fi

    TESTS_FLAG=$(cat "$dir/report.json" | jq -r '.results.tests_passed')
    if [ "$TESTS_FLAG" = "true" ]; then
      TESTS_PASSED=$((TESTS_PASSED + 1))
    fi

    echo "- $(basename $dir): $SUCCESS_FLAG" >> AGGREGATE_RESULTS.md
  fi
done

echo "" >> AGGREGATE_RESULTS.md
echo "## Summary" >> AGGREGATE_RESULTS.md
echo "- Total: $TOTAL" >> AGGREGATE_RESULTS.md
echo "- Success: $SUCCESS ($((SUCCESS * 100 / TOTAL))%)" >> AGGREGATE_RESULTS.md
echo "- Tests Passed: $TESTS_PASSED ($((TESTS_PASSED * 100 / TOTAL))%)" >> AGGREGATE_RESULTS.md

cat AGGREGATE_RESULTS.md
EOF

chmod +x collect-results.sh
./collect-results.sh
```

---

## Expected Timeline

| Repo | Complexity | Est. Time | Priority |
|------|------------|-----------|----------|
| react-datetime | Low | 15 min | ⭐⭐⭐ High |
| input-moment | Low | 15 min | ⭐⭐⭐ High |
| ecommerce-react | Medium | 30 min | ⭐⭐ Medium |
| CLNDR | Medium | 20 min | ⭐ Low |
| rome | Medium | 20 min | ⭐ Low |
| sound-redux | Medium | 25 min | ⭐ Low |
| keystone-classic | High | 45 min | ⭐⭐⭐ High |

**Total estimated time**: ~3 hours

**Recommended approach**: Start with the 3 high-priority repos (both LOW + keystone-classic HIGH) to get diverse data quickly.

---

## Troubleshooting

### Issue: Tests fail to install
```bash
# Try with legacy peer deps
npm install --legacy-peer-deps
```

### Issue: Tests timeout
```bash
# Increase timeout in test script
timeout 300 npm test  # 5 minutes
```

### Issue: Build fails
```bash
# Some repos need building first
npm run build
npm test
```

### Issue: TypeScript errors
```bash
# Some repos may need .ts files migrated too
# Adjust glob pattern in migration script:
const files = glob.sync('**/*.{js,jsx,ts,tsx}', {...})
```

---

## Success Criteria

A migration is considered successful if:
1. ✅ Migration script completes without errors
2. ✅ No `moment` imports remain in code
3. ✅ `dayjs` appears in package.json dependencies
4. ✅ Tests pass (if tests exist)
5. ✅ Bundle size decreases

Document any failures with:
- Error messages
- What went wrong
- What would fix it
- Whether it's a cldash issue or repo-specific issue
