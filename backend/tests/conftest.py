"""Pytest configuration for the backend test suite.

Adds the backend/ directory to sys.path so test modules can import
application code (config, coin_service, etc.) without installing the
package. This is the standard pytest pattern for non-package projects.
"""

import sys
import os

# Insert the backend root so 'import coin_service' resolves correctly
# regardless of where pytest is invoked from.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
