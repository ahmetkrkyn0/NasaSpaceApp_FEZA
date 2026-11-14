"""Shared fixtures for the API tests.

Every client fixture builds a fresh app through ``app.main.create_app`` after
pointing the settings environment variables at the test data, so the tests
never depend on the real ``data/`` directory layout.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

REPO_ROOT: Path = Path(__file__).resolve().parents[3]
FIXTURES_DIR: Path = Path(__file__).resolve().parents[1] / "fixtures"
KERNELS_DIR: Path = REPO_ROOT / "data" / "raw" / "kernels"


def _make_client() -> TestClient:
    """Build a client for the data and kernel directories set in the env."""
    from app.main import create_app

    return TestClient(create_app())


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    """Client using the fixture data files and the real SPICE kernels."""
    monkeypatch.setenv("FEZA_DATA_DIR", str(FIXTURES_DIR))
    monkeypatch.setenv("FEZA_KERNEL_DIR", str(KERNELS_DIR))
    return _make_client()


@pytest.fixture
def no_kernels_client(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> TestClient:
    """Client with fixture data but an empty kernel directory."""
    monkeypatch.setenv("FEZA_DATA_DIR", str(FIXTURES_DIR))
    monkeypatch.setenv("FEZA_KERNEL_DIR", str(tmp_path))
    return _make_client()


@pytest.fixture
def corrupt_kernels_client(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> TestClient:
    """Client whose kernel directory holds unreadable files with the right names."""
    from app.settings import KERNEL_FILES

    for name in KERNEL_FILES:
        (tmp_path / name).write_bytes(b"not a SPICE kernel\n")
    monkeypatch.setenv("FEZA_DATA_DIR", str(FIXTURES_DIR))
    monkeypatch.setenv("FEZA_KERNEL_DIR", str(tmp_path))
    return _make_client()


@pytest.fixture
def no_data_client(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> TestClient:
    """Client with an empty data directory and the real SPICE kernels."""
    monkeypatch.setenv("FEZA_DATA_DIR", str(tmp_path))
    monkeypatch.setenv("FEZA_KERNEL_DIR", str(KERNELS_DIR))
    return _make_client()
