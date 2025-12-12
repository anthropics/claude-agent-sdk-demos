# Repository Catalog for Evaluations

This catalog tracks 30 real-world open source repositories selected for migration evaluations.

## Selection Criteria

Each repository must meet these requirements:
- ✅ Real, publicly accessible repository
- ✅ Has test suite (for verification)
- ✅ Reasonable size (500-10,000 LOC)
- ✅ Clear migration opportunity
- ✅ Active or well-maintained code

## Category 1: Module System Migrations (6)

### 001-commonjs-to-esm-simple
- **Repo**: TBD - Looking for simple CommonJS utility library
- **Stars**: 1000+
- **Size**: ~2000 LOC
- **Migration**: Convert `require()` and `module.exports` to `import`/`export`
- **Complexity**: Low
- **Status**: 🔍 Searching

### 002-commonjs-to-esm-circular-deps
- **Repo**: TBD - Package with known circular dependencies
- **Stars**: 500+
- **Size**: ~3000 LOC
- **Migration**: Handle circular dependency challenges in ESM
- **Complexity**: High
- **Status**: 🔍 Searching

### 003-esm-to-commonjs-reverse
- **Repo**: TBD - Modern ESM package
- **Stars**: 500+
- **Size**: ~2000 LOC
- **Migration**: Reverse migration for compatibility
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 004-dual-mode-package
- **Repo**: TBD - Create dual CJS/ESM exports
- **Stars**: 1000+
- **Size**: ~2500 LOC
- **Migration**: Support both module systems
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 005-dynamic-requires
- **Repo**: TBD - Package with dynamic requires
- **Stars**: 500+
- **Size**: ~1500 LOC
- **Migration**: Convert dynamic requires to static imports
- **Complexity**: High
- **Status**: 🔍 Searching

### 006-barrel-exports
- **Repo**: TBD - Package with barrel export pattern
- **Stars**: 500+
- **Size**: ~2000 LOC
- **Migration**: Optimize barrel exports for tree-shaking
- **Complexity**: Low
- **Status**: 🔍 Searching

## Category 2: Framework Upgrades (6)

### 007-react-class-to-hooks-simple
- **Repo**: TBD - React app with class components
- **Stars**: 1000+
- **Size**: ~3000 LOC
- **Migration**: Simple class components to function components + hooks
- **Complexity**: Low
- **Status**: 🔍 Searching

### 008-react-class-to-hooks-lifecycle
- **Repo**: TBD - React components with complex lifecycle
- **Stars**: 500+
- **Size**: ~2500 LOC
- **Migration**: Handle componentDidMount, componentWillUnmount, etc.
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 009-react-class-to-hooks-refs-context
- **Repo**: TBD - Components using refs and context
- **Stars**: 500+
- **Size**: ~2000 LOC
- **Migration**: Convert refs and context API usage
- **Complexity**: High
- **Status**: 🔍 Searching

### 010-vue2-to-vue3-options
- **Repo**: TBD - Vue 2 app using Options API
- **Stars**: 1000+
- **Size**: ~3000 LOC
- **Migration**: Vue 2 → Vue 3 with Options API
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 011-vue2-to-vue3-composition
- **Repo**: TBD - Migrate to Composition API
- **Stars**: 500+
- **Size**: ~2500 LOC
- **Migration**: Vue 2 → Vue 3 with Composition API
- **Complexity**: High
- **Status**: 🔍 Searching

### 012-angular-js-to-angular
- **Repo**: TBD - AngularJS application
- **Stars**: 500+
- **Size**: ~4000 LOC
- **Migration**: AngularJS → Modern Angular
- **Complexity**: High
- **Status**: 🔍 Searching

## Category 3: API Replacements (6)

### 013-moment-to-dayjs
- **Repo**: TBD - Project using moment.js
- **Stars**: 1000+
- **Size**: ~2000 LOC
- **Migration**: Replace moment.js with day.js
- **Complexity**: Low
- **Status**: 🔍 Searching

### 014-lodash-to-native
- **Repo**: TBD - Heavy lodash usage
- **Stars**: 500+
- **Size**: ~2500 LOC
- **Migration**: Replace lodash with native ES6+ methods
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 015-axios-to-fetch
- **Repo**: TBD - Using axios for HTTP
- **Stars**: 1000+
- **Size**: ~1500 LOC
- **Migration**: Replace axios with native fetch
- **Complexity**: Low
- **Status**: 🔍 Searching

### 016-request-to-node-fetch
- **Repo**: TBD - Using deprecated 'request' package
- **Stars**: 500+
- **Size**: ~2000 LOC
- **Migration**: Migrate from request to node-fetch
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 017-react-deprecated-apis
- **Repo**: TBD - Using deprecated React APIs
- **Stars**: 500+
- **Size**: ~2500 LOC
- **Migration**: Update deprecated React patterns
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 018-node-deprecated-apis
- **Repo**: TBD - Using deprecated Node.js APIs
- **Stars**: 500+
- **Size**: ~1500 LOC
- **Migration**: Update to current Node.js APIs
- **Complexity**: Low
- **Status**: 🔍 Searching

## Category 4: Build Tool Migrations (4)

### 019-webpack-to-vite
- **Repo**: TBD - Webpack-based project
- **Stars**: 1000+
- **Size**: ~3000 LOC
- **Migration**: Migrate from Webpack to Vite
- **Complexity**: High
- **Status**: 🔍 Searching

### 020-webpack-to-esbuild
- **Repo**: TBD - Simple Webpack setup
- **Stars**: 500+
- **Size**: ~2000 LOC
- **Migration**: Switch to esbuild
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 021-babel-to-swc
- **Repo**: TBD - Using Babel for transpilation
- **Stars**: 500+
- **Size**: ~1500 LOC
- **Migration**: Replace Babel with SWC
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 022-rollup-modernization
- **Repo**: TBD - Outdated Rollup config
- **Stars**: 500+
- **Size**: ~1000 LOC
- **Migration**: Update Rollup configuration
- **Complexity**: Low
- **Status**: 🔍 Searching

## Category 5: Testing Migrations (4)

### 023-enzyme-to-rtl
- **Repo**: TBD - React app using Enzyme
- **Stars**: 1000+
- **Size**: ~2500 LOC
- **Migration**: Enzyme → React Testing Library
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 024-jest-27-to-29
- **Repo**: TBD - Jest 27 test suite
- **Stars**: 500+
- **Size**: ~2000 LOC
- **Migration**: Handle Jest breaking changes
- **Complexity**: Low
- **Status**: 🔍 Searching

### 025-mocha-to-vitest
- **Repo**: TBD - Mocha/Chai test suite
- **Stars**: 500+
- **Size**: ~2000 LOC
- **Migration**: Migrate to Vitest
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 026-cypress-to-playwright
- **Repo**: TBD - Cypress E2E tests
- **Stars**: 500+
- **Size**: ~1500 LOC
- **Migration**: Switch to Playwright
- **Complexity**: High
- **Status**: 🔍 Searching

## Category 6: Tooling Updates (4)

### 027-eslint-flat-config
- **Repo**: TBD - Legacy ESLint config
- **Stars**: 500+
- **Size**: ~1000 LOC
- **Migration**: Migrate to flat config format
- **Complexity**: Low
- **Status**: 🔍 Searching

### 028-typescript-4-to-5
- **Repo**: TBD - TypeScript 4.x project
- **Stars**: 1000+
- **Size**: ~3000 LOC
- **Migration**: Upgrade to TS 5.x with strict mode
- **Complexity**: Medium
- **Status**: 🔍 Searching

### 029-prettier-standardization
- **Repo**: TBD - Inconsistent formatting
- **Stars**: 500+
- **Size**: ~2000 LOC
- **Migration**: Apply consistent Prettier config
- **Complexity**: Low
- **Status**: 🔍 Searching

### 030-package-json-modernization
- **Repo**: TBD - Outdated package.json scripts
- **Stars**: 500+
- **Size**: ~1500 LOC
- **Migration**: Modernize npm scripts and dependencies
- **Complexity**: Low
- **Status**: 🔍 Searching

## Search Strategy

To find suitable repositories:

1. **GitHub Search Queries**:
   - `language:JavaScript stars:500..5000 size:<10000`
   - Filter by specific technologies (e.g., `moment.js`, `enzyme`, `webpack`)
   - Look for repositories with test suites

2. **Criteria Checklist**:
   - [ ] Has package.json
   - [ ] Has test suite (npm test works)
   - [ ] Has clear migration opportunity
   - [ ] Size appropriate (500-10k LOC)
   - [ ] License allows forking/modification

3. **Documentation**:
   - For each selected repo, document:
     - Current state
     - Migration plan
     - Expected challenges
     - Success criteria

## Next Steps

1. Use GitHub search to find candidate repositories
2. Clone and validate each candidate
3. Create migration scripts using the template
4. Run evaluations and collect data
5. Build golden dataset for RL training
