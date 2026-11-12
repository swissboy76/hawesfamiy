#!/usr/bin/env python3
"""Check that published archival image files have valid signatures and checksums.

Run: python3 scripts/audit_images.py
Only Python's standard library is required.
Historical originals must be preserved as supplied; this script never rewrites them.
"""
from pathlib import Path
import re
import struct
import sys
import zlib

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "images"
VALID = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

def verify_png(data):
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "incorrect PNG signature"
    p = 8
    saw_end = False
    while p < len(data):
        if p + 12 > len(data):
            return "incomplete PNG chunk"
        length = int.from_bytes(data[p:p + 4], "big")
        end = p + 12 + length
        if end > len(data):
            return "truncated PNG chunk"
        content = data[p + 4:p + 8 + length]
        crc = int.from_bytes(data[p + 8 + length:end], "big")
        if zlib.crc32(content) != crc:
            return "PNG chunk CRC/checksum mismatch"
        if content[:4] == b"IEND":
            saw_end = True
            if end != len(data):
                return "extra data following PNG end marker"
            break
        p = end
    return None if saw_end else "missing PNG IEND chunk"

def verify(path):
    data = path.read_bytes()
    if not data:
        return "empty file"
    suffix = path.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        if not data.startswith(b"\xff\xd8"):
            return "incorrect JPEG signature (not a JPEG)"
        if not data.endswith(b"\xff\xd9"):
            return "truncated JPEG: missing end-of-image marker"
    elif suffix == ".png":
        return verify_png(data)
    elif suffix == ".webp":
        if not (data[:4] == b"RIFF" and data[8:12] == b"WEBP"):
            return "incorrect WEBP signature"
        if int.from_bytes(data[4:8], "little") + 8 != len(data):
            return "WEBP RIFF length mismatch"
    elif suffix == ".gif":
        if not (data.startswith(b"GIF87a") or data.startswith(b"GIF89a")):
            return "incorrect GIF signature"
        if not data.endswith(b";"):
            return "truncated GIF"
    return None

def main():
    files = sorted(p for p in IMAGES.rglob("*") if p.is_file() and p.suffix.lower() in VALID)
    bad = []
    for image in files:
        problem = verify(image)
        if problem:
            bad.append((image.relative_to(ROOT), problem))
    for image, problem in bad:
        print(f"ERROR: {image}: {problem}")
    referenced = set()
    for page in ROOT.rglob("*.html"):
        if ".git" in page.parts:
            continue
        source = page.read_text("utf-8", errors="replace")
        for match in re.finditer(r"""(?:src|href)\s*=\s*['"]([^'"]+\.(?:jpe?g|png|webp|gif|svg))['"]""", source, re.I):
            u = match.group(1)
            if u.startswith(("http:", "https:", "data:")):
                continue
            image = (page.parent / u).resolve()
            if IMAGES in image.parents and not image.exists():
                referenced.add(str(image.relative_to(ROOT)))
    print(f"Validated {len(files)} image files.")
    for missing in sorted(referenced):
        print(f"WARNING: missing referenced scan: {missing}")
    if bad:
        print(f"FAILED: {len(bad)} invalid image files.")
        return 1
    print("PASS: all stored image files have valid format signatures and boundaries.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
