"""Check a curated release against the pinned official source spreadsheets.

This is an offline integrity check, not a scholarly grading or a vocalization
certificate. It never connects to Firestore or changes publication status.
"""

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import unicodedata

from collect_hadeethenc_catalog import LANGUAGES, ROOT, load_release


def digest(value):
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()


def letters(text):
    return "".join(
        char for char in unicodedata.normalize("NFKC", text)
        if unicodedata.category(char).startswith("L") and char != "ـ"
    )


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify(directory, source_directory):
    manifest = json.loads((directory / "release-list.json").read_text())
    records = json.loads((directory / "entries.json").read_text())
    require(len(records) == manifest["count"], "Manifest and snapshot counts differ")
    require(len({row["id"] for row in records}) == len(records), "Duplicate record IDs")
    by_id = {row["id"]: row for row in records}
    require(set(by_id) == {row["id"] for row in manifest["entries"]}, "Selection IDs differ")
    require(not set(by_id).intersection(row["id"] for row in manifest["deferred"]),
            "A deferred record is included in the release")
    require(manifest["languageStructureChanged"] is False, "Language schema changed")
    require(manifest["writesToFirestore"] == manifest["deletionsFromFirestore"] == 0,
            "This shortlist must not describe a database mutation")
    require(manifest["humanScholarlyReviewPerformed"] is False,
            "Editorial review must not be presented as scholarly authentication")
    releases = {code: load_release(source_directory, code) for code in LANGUAGES}
    coverage = Counter()
    grades = Counter()
    themes = Counter()
    seen = {}
    cross_references = 0
    for review in manifest["entries"]:
        row = by_id[review["id"]]
        ident = row["id"]
        source_id = row["provenance"]["sourceId"]
        require(ident == f"hadeethenc-{source_id}", f"Source ID mismatch: {ident}")
        require(digest(row) == review["originalEntrySha256"], f"Snapshot changed: {ident}")
        require(row["arabic"] == row["texts"]["ar"], f"Canonical Arabic differs: {ident}")
        require(review["matn"] in row["arabic"], f"Matn was altered or excerpt invented: {ident}")
        require(re.search("[\u064b-\u0652]", review["matn"]), f"No matn marks: {ident}")
        skeleton = letters(review["matn"])
        require(skeleton not in seen, f"Repeated matn: {ident}, {seen.get(skeleton)}")
        seen[skeleton] = ident
        require(set(row["texts"]) == set(LANGUAGES), f"Missing language columns: {ident}")
        require(set(row["explanations"]) == set(LANGUAGES), f"Missing explanation columns: {ident}")
        require(all(row["texts"][c] and row["explanations"][c] for c in ("en", "id", "ar")),
                f"Missing prioritized source language: {ident}")
        grade = releases["ar"][0][source_id]["grade"]
        require(grade == row["provenance"]["gradeArabic"] == review["sourceGrade"],
                f"Source grade changed: {ident}")
        require("صحيح" in grade or "حسن" in grade, f"Unaccepted source grade: {ident}")
        require(not any(word in grade for word in ("ضعيف", "موقوف")), f"Mixed or weak grade: {ident}")
        available = [code for code in LANGUAGES if row["texts"][code].strip()]
        require(available == review["availableLanguages"], f"Coverage mismatch: {ident}")
        for code in LANGUAGES:
            original, metadata = releases[code]
            source = original.get(source_id)
            if source is None:
                require(row["texts"][code] == row["explanations"][code] == "",
                        f"Invented missing translation: {ident}/{code}")
                require(code not in row["references"], f"Invented reference: {ident}/{code}")
                continue
            require(row["texts"][code] == source["hadith_text"], f"Source text changed: {ident}/{code}")
            require(row["explanations"][code] == source["explanation"],
                    f"Source explanation changed: {ident}/{code}")
            reference = row["references"][code]
            require(reference["url"] == source["link"], f"Source link changed: {ident}/{code}")
            require(reference["version"] == metadata["version"], f"Source version mismatch: {ident}/{code}")
            require(row["provenance"]["sourceHashes"][code] == metadata["sha256"],
                    f"Official archive hash mismatch: {ident}/{code}")
            require(row["provenance"]["transcripts"][code] == metadata["transcript"],
                    f"Publisher notice missing: {ident}/{code}")
            coverage[code] += 1
        if review.get("crossReferenceArabic"):
            actual, expected = letters(review["matn"]), letters(review["crossReferenceArabic"])
            direct = actual == expected
            require(direct == review["review"]["matanArabicLettersMatchRiyadh"],
                    f"Cross-reference claim differs: {ident}")
            if not direct:
                fold = str.maketrans("أإآٱ", "اااا")
                require(actual.translate(fold) == expected.translate(fold)
                        and review["review"].get("matanMatchesAfterAlifHamzaOrthographyNormalization")
                        and review["review"].get("crossReferenceDifference"),
                        f"Unexplained wording difference: {ident}")
        if review.get("riyadhNumber"):
            cross_references += 1
        grades[grade] += 1
        themes[review["theme"]] += 1
    return {
        "count": len(records), "sourceIntegrityPassed": True,
        "availableTextsAndExplanations": {code: coverage[code] for code in LANGUAGES},
        "sourceGrades": dict(grades), "themes": dict(themes),
        "riyadhCrossReferencesReviewed": cross_references,
        "sourceOnlyEditorialReviews": len(records) - cross_references,
        "uniqueMatns": len(seen), "deferred": len(manifest["deferred"]),
        "snapshotSha256": hashlib.sha256((directory / "entries.json").read_bytes()).hexdigest(),
        "writesToFirestore": 0, "deletionsFromFirestore": 0,
        "limitations": [
            "Offline source comparison; does not re-read current Firestore or source websites.",
            "Vocalization and daily suitability are editorial reviews, not certified by this program.",
            "Narrator introductions and isnad are not certified fully vocalized.",
            "Source grades are retained; no new scholarly authentication was performed.",
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--release", type=Path, default=ROOT / "data/releases/vocalized-starter-v1")
    parser.add_argument("--source-dir", type=Path, default=ROOT / ".cache/hadeethenc/2026-10-16")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    result = verify(args.release, args.source_dir)
    output = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(output, encoding="utf-8")
    print(output, end="")


if __name__ == "__main__":
    main()
