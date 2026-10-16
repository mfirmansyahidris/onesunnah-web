"""Stage or release the 1,000-source Android daily collection.

Dry run by default. --commit-drafts only creates missing drafts. --publish
requires an explicit publication approval note; never use it to imply a new
scholarly review. Existing editor changes stop the operation before any write.
"""

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from urllib.parse import urlencode

from collect_hadeethenc_catalog import LANGUAGES, load_release
from import_hadeethenc_candidates import BASE, COLLECTION, ROOT, api, firestore_value, token


DATA = ROOT / "data/android-daily-1000/candidates.json"
RELEASE_ID = "android-daily-1000-20261016"


def unpack(value):
    if "mapValue" in value:
        return {key: unpack(item) for key, item in value["mapValue"].get("fields", {}).items()}
    if "arrayValue" in value:
        return [unpack(item) for item in value["arrayValue"].get("values", [])]
    for key in ("stringValue", "booleanValue", "nullValue", "timestampValue"):
        if key in value:
            return value[key]
    if "integerValue" in value:
        return int(value["integerValue"])
    raise ValueError("Unsupported remote field type")


def all_documents(access_token):
    documents = []
    cursor = None
    while True:
        params = {"pageSize": 1000}
        if cursor:
            params["pageToken"] = cursor
        page = api("GET", f"/documents/{COLLECTION}?{urlencode(params)}", access_token)
        documents.extend(page.get("documents", []))
        cursor = page.get("nextPageToken")
        if not cursor:
            return documents


def verified_candidates(source_dir):
    rows = json.loads(DATA.read_text())
    assert len(rows) == 1000 and len({row["id"] for row in rows}) == 1000
    releases = {code: load_release(source_dir, code) for code in LANGUAGES}
    for row in rows:
        assert row["status"] == "Draft" and row["reviewed"] is False
        assert not any(word in row["provenance"]["gradeArabic"] for word in ("ضعيف", "موقوف"))
        assert all(row["texts"][code].strip() for code in ("ar", "en", "id", "ur"))
        source_id = row["provenance"]["sourceId"]
        assert row["id"] == f"hadeethenc-{source_id}"
        for code in LANGUAGES:
            original = releases[code][0].get(source_id)
            if not original:
                assert row["texts"][code] == "" and code not in row["references"]
                continue
            assert row["texts"][code] == original["hadith_text"]
            assert row["explanations"][code] == original["explanation"]
            assert row["references"][code]["url"] == original["link"]
            assert row["provenance"]["sourceHashes"][code] == releases[code][1]["sha256"]
        assert row["arabic"] == row["texts"]["ar"]
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--commit-drafts", action="store_true")
    mode.add_argument("--publish", action="store_true")
    parser.add_argument("--approval-note", help="Record the explicit project release approval; not a claim of scholarly review")
    parser.add_argument("--source-dir", type=Path, default=ROOT / ".cache/hadeethenc/2026-10-16")
    args = parser.parse_args()
    if args.publish and not args.approval_note:
        parser.error("Publishing requires an explicit publication approval note")
    rows = verified_candidates(args.source_dir)
    access_token = token()
    remote = all_documents(access_token)
    documents = {doc["name"].rsplit("/", 1)[1]: doc for doc in remote}
    original = {row["id"]: row for row in json.loads((ROOT / "data/hadeethenc-candidates.json").read_text())}
    writes = []
    skipped = 0
    for row in rows:
        previous = documents.get(row["id"])
        old = {key: unpack(value) for key, value in previous["fields"].items()} if previous else None
        if old:
            published_base = {key: value for key, value in old.items() if key != "publicationApproval"}
            released_row = dict(row, status="Published", reviewed=True)
            if old.get("publicationApproval", {}).get("releaseId") == RELEASE_ID and published_base == released_row:
                skipped += 1
                continue
            if old != row and old != original.get(row["id"]):
                raise RuntimeError(f"Editor changes detected; refusing to overwrite {row['id']}")
        if previous and not args.publish:
            skipped += 1
            continue
        update = dict(row)
        if args.publish:
            update.update(status="Published", reviewed=True)
            update["publicationApproval"] = {
                "releaseId": RELEASE_ID,
                "scope": "Official-source integrity and approval for public distribution",
                "note": args.approval_note,
                "approvedAt": datetime.now(timezone.utc).isoformat(),
                "scholarlyReviewPerformed": False,
                "malayPolicy": "Explicit English fallback where the Malay source translation is unavailable",
            }
        writes.append({
            "update": {
                "name": f"{BASE.removeprefix('https://firestore.googleapis.com/v1/')}/documents/{COLLECTION}/{row['id']}",
                "fields": {key: firestore_value(value) for key, value in update.items()},
            },
            "currentDocument": {"updateTime": previous["updateTime"]} if previous else {"exists": False},
        })
    summary = {"mode": "publish" if args.publish else "stage-drafts", "verifiedSourceRecords": len(rows),
               "writesPlanned": len(writes), "existingPreserved": skipped,
               "completeFiveLanguages": sum(bool(row["texts"]["ms"]) for row in rows),
               "candidateSha256": hashlib.sha256(DATA.read_bytes()).hexdigest()}
    print(json.dumps(summary, indent=2))
    if not (args.commit_drafts or args.publish):
        print("Dry run only; no Firestore writes")
        return
    snapshot_dir = ROOT / ".cache/android-daily-1000"
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    (snapshot_dir / f"before-{stamp}.json").write_text(json.dumps(remote, ensure_ascii=False))
    committed = 0
    for offset in range(0, len(writes), 100):
        batch = writes[offset:offset + 100]
        result = api("POST", "/documents:commit", access_token, {"writes": batch})
        assert len(result.get("writeResults", [])) == len(batch)
        committed += len(batch)
        print(f"Committed {committed}/{len(writes)} documents")
    (snapshot_dir / f"result-{stamp}.json").write_text(json.dumps(dict(summary, committed=committed), indent=2))


if __name__ == "__main__":
    main()
