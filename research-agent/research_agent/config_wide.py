"""Configuration for Wide Research mode."""

import os
from dataclasses import dataclass


@dataclass
class WideResearchConfig:
    """Configuration settings for Wide Research agent.

    Attributes:
        max_parallel_researchers: Maximum number of researchers to spawn in parallel.
                                 Default is 100. For very large lists, consider batching.
        batch_size: If list exceeds max_parallel_researchers, process in batches of this size.
                   Default is 50.
        auto_batch: If True, automatically batch large lists. If False, ask user for confirmation.
                   Default is False (ask user).
        min_items_for_confirmation: Ask user for confirmation if list has this many items or more.
                                   Default is 20.
    """

    max_parallel_researchers: int = 100
    batch_size: int = 50
    auto_batch: bool = False
    min_items_for_confirmation: int = 20

    @classmethod
    def from_env(cls) -> 'WideResearchConfig':
        """Load configuration from environment variables.

        Environment variables:
            WIDE_RESEARCH_MAX_PARALLEL: Maximum parallel researchers (default: 100)
            WIDE_RESEARCH_BATCH_SIZE: Batch size for large lists (default: 50)
            WIDE_RESEARCH_AUTO_BATCH: Auto-batch without asking (true/false, default: false)
            WIDE_RESEARCH_MIN_CONFIRM: Min items to ask for confirmation (default: 20)
        """
        return cls(
            max_parallel_researchers=int(os.getenv('WIDE_RESEARCH_MAX_PARALLEL', '100')),
            batch_size=int(os.getenv('WIDE_RESEARCH_BATCH_SIZE', '50')),
            auto_batch=os.getenv('WIDE_RESEARCH_AUTO_BATCH', 'false').lower() == 'true',
            min_items_for_confirmation=int(os.getenv('WIDE_RESEARCH_MIN_CONFIRM', '20'))
        )

    def should_confirm(self, item_count: int) -> bool:
        """Check if user confirmation is needed for the given item count."""
        return item_count >= self.min_items_for_confirmation

    def needs_batching(self, item_count: int) -> bool:
        """Check if the item count requires batching."""
        return item_count > self.max_parallel_researchers

    def calculate_batches(self, item_count: int) -> int:
        """Calculate number of batches needed for the given item count."""
        if not self.needs_batching(item_count):
            return 1
        return (item_count + self.batch_size - 1) // self.batch_size


# Default configuration instance
DEFAULT_CONFIG = WideResearchConfig()
