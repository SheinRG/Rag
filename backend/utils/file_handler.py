"""
DocMind AI — File Handler
Validates uploaded files (extension, size).
"""

import os
import logging
from config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB

logger = logging.getLogger(__name__)


def validate_file(filename: str, file_size: int) -> tuple[bool, str]:
    """
    Validates a file's extension and size.
    Returns (is_valid, error_message).
    """
    # Check extension
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"File type '{ext}' is not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"

    # Check file size
    if file_size > MAX_FILE_SIZE_BYTES:
        return False, f"File size exceeds the {MAX_FILE_SIZE_MB}MB limit."

    return True, ""


def get_file_type(filename: str) -> str:
    """Extracts the file type from the filename (without the dot)."""
    ext = os.path.splitext(filename)[1].lower()
    return ext.lstrip(".")
