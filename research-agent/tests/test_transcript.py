import os
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

from research_agent.utils.transcript import TranscriptWriter, setup_session


class SessionDirectoryTests(unittest.TestCase):
    def setUp(self):
        previous_cwd = Path.cwd()
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.addCleanup(os.chdir, previous_cwd)
        os.chdir(directory.name)
        clock_patch = patch("research_agent.utils.transcript.datetime")
        self.addCleanup(clock_patch.stop)
        clock = clock_patch.start()
        clock.now.return_value = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

    def test_same_second_sessions_preserve_earlier_transcripts(self):
        first_file, first_dir = setup_session()
        with TranscriptWriter(first_file) as writer:
            writer.write_to_file("first session")
        second_file, second_dir = setup_session()
        with TranscriptWriter(second_file) as writer:
            writer.write_to_file("second session")

        self.assertEqual(first_file.read_text(encoding="utf-8"), "first session")
        self.assertEqual(second_file.read_text(encoding="utf-8"), "second session")
        self.assertNotEqual(first_dir, second_dir)
        self.assertEqual(first_file.parent, first_dir)
        self.assertEqual(second_file.parent, second_dir)

    def test_concurrent_sessions_get_separate_directories(self):
        with ThreadPoolExecutor(max_workers=4) as executor:
            sessions = list(executor.map(lambda _: setup_session(), range(8)))
        directories = {directory for _, directory in sessions}
        self.assertEqual(len(directories), 8)
        self.assertTrue(all(directory.is_dir() for directory in directories))


if __name__ == "__main__":
    unittest.main()
