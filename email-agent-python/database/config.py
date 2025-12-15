"""Database configuration."""
import os
from pathlib import Path

DATABASE_PATH = os.getenv("DATABASE_PATH", "./emails.db")
