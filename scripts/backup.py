"""Create a consistent SQLite snapshot and copy retained uploads to a new ZIP."""

import argparse, sqlite3, tempfile, zipfile, json
from pathlib import Path
from datetime import datetime, timezone

parser = argparse.ArgumentParser()
parser.add_argument("--data-dir", default="/app/data")
parser.add_argument("--output", required=True)
args = parser.parse_args()
root, output = Path(args.data_dir), Path(args.output)
if not (root / "site.db").is_file():
    parser.error("site.db not found; verify the actual production volume first")
if output.exists():
    parser.error("Output exists; choose a new filename")
output.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory() as temp:
    snapshot = Path(temp) / "site.db"
    with sqlite3.connect(
        f'file:{root / "site.db"}?mode=ro', uri=True
    ) as source, sqlite3.connect(snapshot) as dest:
        source.backup(dest)
        if dest.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise RuntimeError("Database integrity check failed")
    try:
        with zipfile.ZipFile(output, "x", zipfile.ZIP_DEFLATED) as archive:
            archive.write(snapshot, "site.db")
            for folder in ("uploads", "attachments"):
                for item in (root / folder).glob("*"):
                    if item.is_file() and not item.is_symlink():
                        archive.write(item, folder + "/" + item.name)
            archive.writestr(
                "backup.json",
                json.dumps(
                    {"created_at": datetime.now(timezone.utc).isoformat(), "format": 1}
                ),
            )
    except Exception:
        output.unlink(missing_ok=True)
        raise
print(str(output.resolve()))
