"""Put ``backend`` on the import path so ``app`` imports without installing.

This lets these tests run before the server skeleton (F1-A) is merged.
"""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
