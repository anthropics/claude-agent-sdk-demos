#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cross-Business Learning Sync

Automatically propagates patterns from _template/.claude/rules/ to all businesses.

Usage:
    python sync-learnings.py [--verbose]

Flags:
    --verbose: Show detailed output
"""

import sys
import os
from pathlib import Path
import shutil
from datetime import datetime
import json
import io

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# ANSI color codes
GREEN = "\033[92m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

class PatternSyncEngine:
    """Syncs patterns across all businesses."""

    def __init__(self, verbose=False):
        self.verbose = verbose
        self.template_root = Path(__file__).parent
        self.workspace_root = self.template_root.parent
        self.businesses_dir = self.workspace_root / "businesses"
        self.rules_dir = self.template_root / ".claude" / "rules"

        self.stats = {
            "rules_found": 0,
            "businesses_synced": 0,
        }

    def log(self, message, color=""):
        """Print message with optional color."""
        if color:
            print(f"{color}{message}{RESET}")
        else:
            print(message)

    def log_verbose(self, message):
        """Print message only in verbose mode."""
        if self.verbose:
            print(f"  {message}")

    def sync_rules_to_businesses(self):
        """Sync rules from template to all businesses."""
        self.log(f"\n{BLUE}=== Syncing Rules to Businesses ==={RESET}")

        if not self.rules_dir.exists():
            self.log(f"No rules directory found at {self.rules_dir}", YELLOW)
            return

        # Count rules
        rules = list(self.rules_dir.glob("*.md"))
        self.stats["rules_found"] = len(rules)
        self.log(f"Found {len(rules)} rules in template")

        if not self.businesses_dir.exists():
            self.log("No businesses directory found", YELLOW)
            return

        # Sync to each business
        for business_path in sorted(self.businesses_dir.iterdir()):
            if not business_path.is_dir():
                continue

            business_rules_dir = business_path / ".claude" / "rules"

            # Create rules directory if it doesn't exist
            if not business_rules_dir.exists():
                self.log_verbose(f"Creating .claude/rules/ in {business_path.name}")
                business_rules_dir.mkdir(parents=True, exist_ok=True)

            # Copy all rules
            for rule_file in rules:
                dest_file = business_rules_dir / rule_file.name
                shutil.copy2(rule_file, dest_file)
                self.log_verbose(f"  Copied {rule_file.name} to {business_path.name}")

            self.stats["businesses_synced"] += 1
            self.log(f"  {GREEN}✓{RESET} Synced {len(rules)} rules to {business_path.name}")

    def create_audit_trail(self):
        """Create audit trail of sync operation."""
        audit_dir = self.template_root / "audit"
        if not audit_dir.exists():
            audit_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        audit_file = audit_dir / f"sync_{timestamp}.json"

        audit_data = {
            "timestamp": timestamp,
            "statistics": self.stats,
        }

        audit_file.write_text(json.dumps(audit_data, indent=2), encoding='utf-8')
        self.log_verbose(f"Created audit trail: {audit_file.name}")

    def print_summary(self):
        """Print summary of sync operation."""
        self.log(f"\n{BLUE}{'=' * 60}{RESET}")
        self.log(f"{BLUE}SYNC SUMMARY{RESET}")
        self.log(f"{BLUE}{'=' * 60}{RESET}")

        self.log(f"\nRules synced:           {self.stats['rules_found']}")
        self.log(f"Businesses updated:     {self.stats['businesses_synced']}")

        self.log(f"\n{GREEN}✓ Sync complete!{RESET}")

    def run(self):
        """Run the sync operation."""
        self.log(f"{BLUE}{'=' * 60}{RESET}")
        self.log(f"{BLUE}Cross-Business Learning Sync{RESET}")
        self.log(f"{BLUE}{'=' * 60}{RESET}")
        self.log(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

        # Sync rules to all businesses
        self.sync_rules_to_businesses()

        # Create audit trail
        self.create_audit_trail()

        # Print summary
        self.print_summary()


def main():
    """Main entry point."""
    verbose = "--verbose" in sys.argv

    engine = PatternSyncEngine(verbose=verbose)
    engine.run()


if __name__ == "__main__":
    main()
