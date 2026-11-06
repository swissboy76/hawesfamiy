#!/usr/bin/env python3
"""Archive portrait images from their exact Wikipedia biography pages.

Run: python scripts/sync_wikipedia_portraits.py
The script only accepts images from Wikimedia upload servers and retains
the biography URL and image URL in a human-readable attribution manifest.
"""
import json
import mimetypes
import pathlib
import re
import urllib.parse
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "images"
OUT.mkdir(exist_ok=True)
SUBJECTS = {
    "william": "William_Hawes_(composer)",
    "maria": "Maria_Billington_Hawes",
}
HEADERS = {
    "User-Agent": "HawesFamilyArchive/1.0 (historical family archive; Wikimedia content attribution)",
    "Accept": "text/html,application/json,image/*",
}


def fetch(url):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read(), response.headers.get("Content-Type", "").split(";")[0]


class ImageMeta(HTMLParser):
    def __init__(self):
        super().__init__()
        self.og = None
        self.images = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "meta" and d.get("property") == "og:image":
            self.og = d.get("content")
        if tag == "img":
            self.images.append((d.get("src", ""), d.get("alt", "")))


def find_image(title):
    article = "https://en.wikipedia.org/wiki/" + title
    api = ("https://en.wikipedia.org/w/api.php?"
           + urllib.parse.urlencode({"action":"query","format":"json",
               "prop":"pageimages","pithumbsize":1200,"titles":title}))
    try:
        content, _ = fetch(api)
        d = json.loads(content)
        for page in d.get("query", {}).get("pages", {}).values():
            thumb = page.get("thumbnail", {})
            if thumb.get("source"):
                return thumb["source"], article
    except Exception as exc:
        print("Wikipedia image API unavailable:", exc)

    html, _ = fetch(article)
    parser = ImageMeta()
    parser.feed(html.decode("utf-8", errors="replace"))
    candidates = [(parser.og or "", "lead")] + [
        (url, alt) for url, alt in parser.images
        if "Hawes" in alt or "Merest" in alt
    ]
    for url, label in candidates:
        if url.startswith("//"):
            url = "https:" + url
        if url.startswith("https://upload.wikimedia.org/") and not re.search(
            r"wiki(?:media)?|logo|icon|svg", urllib.parse.urlparse(url).path, re.I
        ):
            return url, article
    raise ValueError("No suitable portrait image found on " + article)


manifest = {}
failed = []
for key, title in SUBJECTS.items():
    try:
        url, article = find_image(title)
        raw, mime = fetch(url)
        ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" }.get(mime)
        if not ext or len(raw) < 5000:
            raise ValueError("Unexpected file type or missing image: " + mime)
        path = OUT / ("portrait-" + key + ext)
        path.write_bytes(raw)
        manifest[key] = {
            "src": "images/" + path.name,
            "article": article,
            "source_image": url,
            "alt": "Portrait shown in the Wikipedia biography: " + title.replace("_", " "),
        }
        print("Downloaded", key, "from", url)
    except Exception as exc:
        print("FAILED", key, ":", exc)
        failed.append(key)
# Never overwrite a valid manifest with partial or empty images.
if failed:
    raise SystemExit("Portrait synchronization incomplete: " + ", ".join(failed))
(OUT / "portraits.json").write_text(json.dumps(manifest, indent=2) + "\n")
