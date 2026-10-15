"""Create the 100 unreviewed HadeethEnc draft candidates in Firestore.

Run `npx firebase-tools login` first. Dry-run by default; pass --commit to write.
The import is atomic and refuses to overwrite any existing document.
"""

import argparse
import json
import time
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "hadeethenc-candidates.json"
FIREBASE_CONFIG = Path.home() / ".config" / "configstore" / "firebase-tools.json"
PROJECT = "onesunnah-e3a1e"
DATABASE = "(default)"
COLLECTION = "hadiths"
BASE = f"https://firestore.googleapis.com/v1/projects/{PROJECT}/databases/{DATABASE}"
LANGUAGES = ("en", "id", "ms", "ar", "ur")


def token():
    auth = json.loads(FIREBASE_CONFIG.read_text(encoding="utf-8"))["tokens"]
    if auth["expires_at"] / 1000 < time.time() + 60:
        raise RuntimeError("Firebase CLI access expired; refresh the CLI login before importing")
    return auth["access_token"]


def api(method, path, access_token, body=None):
    payload = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    request = Request(
        BASE + path,
        data=payload,
        method=method,
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
    )
    try:
        with urlopen(request, timeout=60) as response:
            return json.load(response)
    except HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:1000]
        raise RuntimeError(f"Firestore request failed ({error.code}): {detail}") from None


def firestore_value(value):
    if value is None:
        return {"nullValue": None}
    if isinstance(value, bool):
        return {"booleanValue": value}
    if isinstance(value, str):
        return {"stringValue": value}
    if isinstance(value, int):
        return {"integerValue": str(value)}
    if isinstance(value, dict):
        return {"mapValue": {"fields": {key: firestore_value(item) for key, item in value.items()}}}
    if isinstance(value, list):
        return {"arrayValue": {"values": [firestore_value(item) for item in value]}}
    raise TypeError(f"Unsupported Firestore value: {type(value).__name__}")


def candidates():
    rows = json.loads(DATA.read_text(encoding="utf-8"))
    if len(rows) != 100 or len({row["id"] for row in rows}) != 100:
        raise ValueError("Expected exactly 100 unique candidate IDs")
    for row in rows:
        if not row["id"].startswith("hadeethenc-") or row["status"] != "Draft" or row["reviewed"] is not False:
            raise ValueError(f"Candidate is not an unpublished HadeethEnc draft: {row['id']}")
        for language in LANGUAGES:
            if not row["texts"][language].strip() or not row["references"][language]["url"].startswith(
                f"https://hadeethenc.com/{language}/browse/hadith/"
            ):
                raise ValueError(f"Missing text or official source: {row['id']} ({language})")
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--commit", action="store_true", help="create the candidates in the live database")
    options = parser.parse_args()
    rows = candidates()
    access_token = token()
    existing = api("GET", f"/documents/{COLLECTION}?pageSize=1000", access_token)
    if existing.get("documents"):
        raise RuntimeError("The target collection is not empty; refusing to import over existing content")
    writes = [
        {
            "update": {
                "name": f"projects/{PROJECT}/databases/{DATABASE}/documents/{COLLECTION}/{row['id']}",
                "fields": {key: firestore_value(value) for key, value in row.items()},
            },
            "currentDocument": {"exists": False},
        }
        for row in rows
    ]
    print(f"Validated {len(writes)} unpublished drafts for {PROJECT}/{DATABASE}/{COLLECTION}; remote collection is empty")
    if not options.commit:
        print("Dry run complete; use --commit to create them atomically")
        return
    result = api("POST", "/documents:commit", access_token, {"writes": writes})
    if len(result.get("writeResults", [])) != len(rows):
        raise RuntimeError("Commit response did not contain one result per candidate")
    print(f"Created {len(rows)} draft documents in Firestore")


if __name__ == "__main__":
    main()
