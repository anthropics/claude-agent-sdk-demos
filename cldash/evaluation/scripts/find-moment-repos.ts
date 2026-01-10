#!/usr/bin/env tsx
/**
 * Find and validate repositories using moment.js
 *
 * This script:
 * 1. Searches GitHub for repos using moment.js
 * 2. Validates they have moment in dependencies
 * 3. Checks they have tests
 * 4. Catalogs them for migration testing
 */

import { exec } from '../../lib/exec';
import * as fs from 'fs/promises';
import * as path from 'path';

interface RepoCandidate {
  name: string;
  owner: string;
  stars: number;
  size_kb: number;
  url: string;
  description: string;
  hasMoment?: boolean;
  hasTests?: boolean;
  momentVersion?: string;
  testCommand?: string;
  packageManager?: 'npm' | 'yarn' | 'pnpm';
}

const CANDIDATE_REPOS = [
  // From initial searches
  'bradtraversy/devconnector_2.0',
  'andrewngu/sound-redux',
  'arqex/react-datetime',
  'kylestetz/CLNDR',
  'bevacqua/rome',
  'wangzuo/input-moment',
  'danielbayerlein/dashboard',
  'DesignRevision/shards-dashboard-react',
  'r-park/todo-react-redux',
  'Vuedo/vuedo',

  // Additional known repos that likely use moment
  'webpack/webpack.js.org',
  'airbnb/javascript',
  'storybookjs/storybook',
];

async function checkRepoForMoment(repoFullName: string): Promise<RepoCandidate | null> {
  console.log(`\nChecking ${repoFullName}...`);

  try {
    // Get repo metadata from GitHub
    const metadataResult = await exec(`gh repo view ${repoFullName} --json name,owner,stargazersCount,description,url`, {
      timeout: 10000
    });

    if (!metadataResult.success) {
      console.log(`  ⚠ Could not fetch metadata`);
      return null;
    }

    const metadata = JSON.parse(metadataResult.stdout);

    // Get package.json content
    const pkgResult = await exec(`gh api repos/${repoFullName}/contents/package.json --jq '.content' | base64 -d`, {
      timeout: 10000
    });

    if (!pkgResult.success) {
      console.log(`  ⚠ No package.json found`);
      return null;
    }

    const packageJson = JSON.parse(pkgResult.stdout);

    // Check for moment in dependencies
    const hasMoment = !!(
      packageJson.dependencies?.moment ||
      packageJson.devDependencies?.moment
    );

    if (!hasMoment) {
      console.log(`  ✗ Does not use moment.js`);
      return null;
    }

    const momentVersion = packageJson.dependencies?.moment || packageJson.devDependencies?.moment;
    console.log(`  ✓ Uses moment@${momentVersion}`);

    // Check for test command
    const hasTests = !!packageJson.scripts?.test;
    const testCommand = packageJson.scripts?.test;

    if (hasTests) {
      console.log(`  ✓ Has tests: ${testCommand}`);
    } else {
      console.log(`  ⚠ No test script found`);
    }

    // Detect package manager
    let packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm';

    const hasYarnLock = await exec(`gh api repos/${repoFullName}/contents/yarn.lock`, { timeout: 5000 });
    const hasPnpmLock = await exec(`gh api repos/${repoFullName}/contents/pnpm-lock.yaml`, { timeout: 5000 });

    if (hasYarnLock.success) packageManager = 'yarn';
    else if (hasPnpmLock.success) packageManager = 'pnpm';

    console.log(`  ✓ Package manager: ${packageManager}`);

    return {
      name: metadata.name,
      owner: metadata.owner.login,
      stars: metadata.stargazersCount,
      size_kb: 0, // We'll get this when cloning
      url: metadata.url,
      description: metadata.description || '',
      hasMoment: true,
      hasTests,
      momentVersion,
      testCommand,
      packageManager
    };

  } catch (error) {
    console.log(`  ✗ Error checking repo:`, (error as Error).message);
    return null;
  }
}

async function main() {
  console.log('🔍 Finding repositories using moment.js\n');
  console.log('='.repeat(60));

  const validRepos: RepoCandidate[] = [];

  for (const repoFullName of CANDIDATE_REPOS) {
    const repo = await checkRepoForMoment(repoFullName);
    if (repo) {
      validRepos.push(repo);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Found ${validRepos.length} valid repositories using moment.js\n`);

  // Generate catalog
  const catalog = {
    generated: new Date().toISOString(),
    total_repositories: validRepos.length,
    repositories: validRepos.sort((a, b) => b.stars - a.stars)
  };

  const catalogPath = path.join(__dirname, '../MOMENT_REPOS_CATALOG.json');
  await fs.writeFile(catalogPath, JSON.stringify(catalog, null, 2));

  console.log(`📋 Catalog saved to: MOMENT_REPOS_CATALOG.json\n`);

  // Print summary table
  console.log('Repository Summary:');
  console.log('-'.repeat(80));
  console.log('Owner/Name'.padEnd(40), 'Stars'.padEnd(8), 'Tests', 'Version');
  console.log('-'.repeat(80));

  for (const repo of validRepos) {
    const repoName = `${repo.owner}/${repo.name}`.padEnd(40);
    const stars = repo.stars.toString().padEnd(8);
    const hasTests = repo.hasTests ? '✓' : '✗';
    const version = repo.momentVersion || '?';

    console.log(repoName, stars, hasTests.padEnd(6), version);
  }

  console.log('-'.repeat(80));
  console.log(`\nNext steps:`);
  console.log(`  1. Review ${validRepos.length} repositories in MOMENT_REPOS_CATALOG.json`);
  console.log(`  2. Clone selected repositories for testing`);
  console.log(`  3. Run migrations and collect metrics`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { checkRepoForMoment };
