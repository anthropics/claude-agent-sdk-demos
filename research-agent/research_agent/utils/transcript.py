"""Transcript handling for conversation history."""

import logging
import tempfile
from datetime import datetime
from pathlib import Path


def setup_session() -> tuple[Path, Path]:
    """Setup session directory and transcript file.

    Creates a session folder in logs/ with timestamp, containing both
    transcript and detailed tool call logs.

    Returns:
        Tuple of (transcript_file_path, session_dir_path)
    """
    # Create session directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    logs_dir = Path("logs")
    logs_dir.mkdir(parents=True, exist_ok=True)
    session_dir = Path(tempfile.mkdtemp(prefix=f"session_{timestamp}_", dir=logs_dir))

    # Transcript file in session directory
    transcript_file = session_dir / "transcript.txt"

    # Suppress noisy HTTP debug logs from urllib3
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)

    return transcript_file, session_dir


class TranscriptWriter:
    """Helper to write output to both console and transcript file."""

    def __init__(self, transcript_file: Path):
        self.file = open(transcript_file, "w", encoding="utf-8")

    def write(self, text: str, end: str = "", flush: bool = True):
        """Write text to both console and transcript."""
        print(text, end=end, flush=flush)
        self.file.write(text + end)
        if flush:
            self.file.flush()

    def write_to_file(self, text: str, flush: bool = True):
        """Write text to transcript file only (not console)."""
        self.file.write(text)
        if flush:
            self.file.flush()

    def close(self):
        """Close the transcript file."""
        self.file.close()

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        self.close()
        return False
