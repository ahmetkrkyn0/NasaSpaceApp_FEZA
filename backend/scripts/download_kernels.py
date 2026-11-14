"""Download the five SPICE kernels used by the backend.

The kernels are fetched from the NAIF generic kernels server into
``<repo>/data/raw/kernels`` (``<repo>`` is the repository root, i.e. the
parent of ``backend/``). Files that already exist with a non-zero size are
skipped, so the script is safe to run repeatedly. Each download is written to
``<name>.part`` first and renamed into place only after it completes, so an
interrupted run never leaves a truncated kernel behind.

Usage (from the repository root):

    python backend/scripts/download_kernels.py
    python backend/scripts/download_kernels.py --force
    python backend/scripts/download_kernels.py --dest /path/to/kernels

Options:
    --dest DIR   Directory to download into (default: <repo>/data/raw/kernels).
    --force      Re-download files even if they are already present.

The script uses only the Python standard library and does not import the
application package.
"""

from __future__ import annotations

import argparse
import sys
import urllib.request
from pathlib import Path

BASE_URL = "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/"

# Remote paths relative to BASE_URL; the local file name is the last segment.
KERNELS: tuple[str, ...] = (
    "lsk/naif0012.tls",
    "pck/pck00011.tpc",
    "spk/planets/de440s.bsp",
    "pck/moon_pa_de440_200625.bpc",
    "fk/satellites/moon_de440_250416.tf",
)

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DEST = REPO_ROOT / "data" / "raw" / "kernels"

CHUNK_SIZE = 1024 * 1024


def human_size(num_bytes: int) -> str:
    """Return a compact human-readable size such as ``32.7 MB``."""
    size = float(num_bytes)
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024.0 or unit == "GB":
            if unit == "B":
                return f"{int(size)} {unit}"
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{int(num_bytes)} B"


def download(remote_path: str, dest_dir: Path, force: bool) -> tuple[str, int]:
    """Download one kernel.

    Returns ``(status, size_bytes)`` where status is ``"skip"`` or
    ``"download"``. Raises on any failure after removing the ``.part`` file.
    """
    name = Path(remote_path).name
    target = dest_dir / name

    if not force and target.exists() and target.stat().st_size > 0:
        size = target.stat().st_size
        print(f"skip {name} (present)")
        print(f"  {name}: {human_size(size)} ({size} bytes)")
        return "skip", size

    url = BASE_URL + remote_path
    part = target.with_name(target.name + ".part")

    try:
        print(f"download {name} from {url}")
        with urllib.request.urlopen(url) as response, part.open("wb") as handle:
            while True:
                chunk = response.read(CHUNK_SIZE)
                if not chunk:
                    break
                handle.write(chunk)
        part.replace(target)
    except BaseException:
        if part.exists():
            part.unlink()
        raise

    size = target.stat().st_size
    print(f"  {name}: {human_size(size)} ({size} bytes)")
    return "download", size


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Download the five SPICE kernels used by the backend.",
    )
    parser.add_argument(
        "--dest",
        type=Path,
        default=DEFAULT_DEST,
        help=f"directory to download into (default: {DEFAULT_DEST})",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="re-download files even if they are already present",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    dest_dir: Path = args.dest

    try:
        dest_dir.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        print(f"error: cannot create {dest_dir}: {exc}", file=sys.stderr)
        return 1

    downloaded = 0
    skipped = 0
    total_bytes = 0

    for remote_path in KERNELS:
        try:
            status, size = download(remote_path, dest_dir, args.force)
        except Exception as exc:  # noqa: BLE001 - report any failure and exit 1
            print(f"error: failed to download {remote_path}: {exc}", file=sys.stderr)
            return 1
        if status == "download":
            downloaded += 1
            total_bytes += size
        else:
            skipped += 1

    print(
        f"done: {downloaded} downloaded, {skipped} skipped, "
        f"{human_size(total_bytes)} fetched into {dest_dir}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
