"""Transcript handling for conversation history."""

import logging
from datetime import datetime
from pathlib import Path


def setup_session() -> tuple[Path, Path]:
    """Set up session directory and transcript file.

    Creates a timestamped session folder under ``logs/`` for storing the
    conversation transcript and structured tool-call logs.

    Returns
    -------
    tuple[Path, Path]
        ``(transcript_file_path, session_dir_path)``
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    session_dir = Path("logs") / f"session_{timestamp}"
    session_dir.mkdir(parents=True, exist_ok=True)

    transcript_file = session_dir / "transcript.txt"

    # Suppress noisy HTTP debug logs
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)

    return transcript_file, session_dir


class TranscriptWriter:
    """Writes output to both the console and a transcript file."""

    def __init__(self, transcript_file: Path):
        self.file = open(transcript_file, "w", encoding="utf-8")

    def write(self, text: str, end: str = "", flush: bool = True):
        """Write *text* to console and transcript file."""
        print(text, end=end, flush=flush)
        self.file.write(text + end)
        if flush:
            self.file.flush()

    def write_to_file(self, text: str, flush: bool = True):
        """Write *text* to the transcript file only (not the console)."""
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
