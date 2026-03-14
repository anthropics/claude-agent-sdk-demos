# Contributing to Multi-Business Workspace Demo

Thank you for your interest in contributing! This demo is part of the [anthropics/claude-agent-sdk-demos](https://github.com/anthropics/claude-agent-sdk-demos) repository.

## Ways to Contribute

### 1. Report Issues

Found a bug or have a suggestion?

- **Check existing issues** first to avoid duplicates
- **Use issue templates** (bug report, feature request, pattern contribution)
- **Provide context**: What business setup are you using? What went wrong?

### 2. Share Patterns

Discovered a new pattern in your multi-business setup?

**Submit a Pattern Contribution:**

1. Document in this format:
   ```markdown
   ## Pattern: [Name]
   **Value:** HIGH/MEDIUM/LOW
   **Problem:** What it solves
   **Solution:** How it works
   **Impact:** Measurable results
   **Tradeoffs:** What you give up
   **When to Use:** Specific scenarios
   ```

2. Create an issue with label `pattern-contribution`
3. Include real-world usage examples
4. Specify if it's generalizable or domain-specific

**Quality Bar:**
- ✅ Proven in production (not theoretical)
- ✅ Measurable impact (time saved, errors reduced, etc.)
- ✅ Generalizable across businesses
- ✅ Documented tradeoffs

### 3. Improve Documentation

Help others understand this architecture:

- Fix typos or unclear explanations
- Add diagrams or examples
- Improve setup instructions
- Document edge cases

### 4. Code Improvements

Enhance the demo code:

- **sync-learnings.py**: Better error handling, new features
- **Agent prompts**: Clearer instructions, better examples
- **Templates**: More business types, better defaults

## Contribution Process

### For Documentation/Small Fixes

1. Fork the repository
2. Make your changes
3. Submit a pull request with clear description
4. Wait for review

### For New Features/Patterns

1. **Create an issue first** to discuss
2. Wait for maintainer feedback
3. Implement once approved
4. Submit PR referencing the issue

### For Major Changes

1. **Start a discussion** in issues
2. Propose your approach
3. Get consensus before coding
4. Break into smaller PRs if possible

## Development Setup

```bash
# Clone the repository
git clone https://github.com/anthropics/claude-agent-sdk-demos.git
cd claude-agent-sdk-demos/multi-business-workspace

# Install dependencies
pip install -r requirements.txt

# Run tests (if available)
python -m pytest tests/

# Test sync automation
python _template/sync-learnings.py --verbose
```

## Code Style

- **Python**: Follow PEP 8, use type hints
- **Markdown**: Use GitHub-flavored markdown
- **Agent prompts**: Clear, concise, example-driven
- **Documentation**: Prioritize clarity over cleverness

## Pattern Extraction Guidelines

When adding patterns to `PATTERNS_DISCOVERED.md`:

**Value Rating:**
- **HIGH**: Saves 50%+ time OR prevents major errors OR enables new workflows
- **MEDIUM**: Saves 10-50% time OR improves quality noticeably
- **LOW**: Nice to have, minimal impact

**Documentation:**
- Include real numbers (87% time savings, not "much faster")
- Show before/after code examples
- Explain when NOT to use the pattern
- Document any dependencies

**Organization:**
- Group by category (Architecture, Automation, Development)
- Order by value (HIGH → MEDIUM → LOW)
- Include source business (e.g., "Source: content-services")

## Testing Your Contribution

Before submitting:

1. **Test locally:**
   ```bash
   # Create test business
   cp -r _template/templates/saas-platform businesses/test-business

   # Test sync
   python _template/sync-learnings.py --verbose

   # Test agent invocation
   @workspace-agent "audit ecosystem"
   ```

2. **Verify documentation:**
   - All links work
   - Code examples run
   - Screenshots are current
   - Markdown renders correctly

3. **Check for secrets:**
   - No API keys
   - No personal information
   - No business-specific data

## Review Process

**Timeline:**
- Small fixes: 1-3 days
- New patterns: 3-7 days
- Major features: 1-2 weeks

**Criteria:**
- ✅ Follows contribution guidelines
- ✅ Tested in production or thorough demo
- ✅ Documentation clear and complete
- ✅ No breaking changes to existing setups
- ✅ Aligns with architecture philosophy

## Architecture Philosophy

Contributions should align with these principles:

1. **Compound Learning**: Patterns discovered in one business benefit all
2. **Autonomous with Boundaries**: Clear decision frameworks
3. **Machine-First**: Functional naming, flat structure
4. **Production-Proven**: Real-world usage over theory
5. **Zero-Friction**: Automation over manual work

## Questions?

- **General questions**: Create a discussion
- **Bug reports**: Use issue template
- **Pattern ideas**: Create pattern-contribution issue
- **Security concerns**: Email security@anthropic.com (do NOT create public issue)

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in pattern documentation
- Mentioned in release notes

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make Claude Code better for multi-business users!** 🙏
