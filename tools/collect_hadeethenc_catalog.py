"""Collect a source-preserving hadith catalog; missing translations stay empty.

Run with openpyxl and a directory containing the five official XLSX releases.
This collector never uploads, publishes, alters the original 100-candidate file,
or generates translations. A 1,000-row catalog is not necessarily 1,000 complete
five-language records; coverage.json reports the actual result.
"""

import argparse
from collections import Counter
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import unicodedata
from zoneinfo import ZoneInfo

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[1]
LANGUAGES = ("en", "id", "ms", "ar", "ur")
CORE_LANGUAGES = ("en", "id", "ar", "ur")
TERMS_URL = "https://hadeethenc.com/en/home"


def fingerprint(text):
    # Used only to find duplicates; the stored source text is never normalized.
    letters = "".join(
        char for char in unicodedata.normalize("NFKC", text or "")
        if unicodedata.category(char).startswith("L") and char != "ـ"
    )
    return hashlib.sha256(letters.encode()).hexdigest()


def load_release(directory, language):
    path = directory / f"{language}.xlsx"
    workbook = load_workbook(path, read_only=True, data_only=True)
    try:
        values = iter(workbook.active.values)
        transcript = next(values)[0]
        columns = next(values)
        records = {}
        for row in values:
            if not row[0]:
                continue
            source_id = str(row[0])
            if source_id in records:
                raise ValueError(f"Duplicate source ID in {language}: {source_id}")
            records[source_id] = dict(zip(columns, row))
    finally:
        workbook.close()
    version = re.search(r"\(v([\d.]+)\)", transcript)
    if not version:
        raise ValueError(f"Missing source version for {language}")
    return records, {
        "language": language,
        "filename": path.name,
        "downloadUrl": f"https://hadeethenc.com/en/browse/download/{language}",
        "version": f"v{version.group(1)}",
        "transcript": transcript,
        "recordCount": len(records),
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
    }


def source_text(records, source_id):
    return records.get(source_id, {}).get("hadith_text") or ""


def collect(source_directory, count, date):
    releases = {code: load_release(source_directory, code) for code in LANGUAGES}
    data = {code: release[0] for code, release in releases.items()}
    common = set.intersection(*(set(data[code]) for code in CORE_LANGUAGES))
    common = {source_id for source_id in common if all(
        source_text(data[code], source_id).strip() for code in CORE_LANGUAGES
    )}
    complete = {source_id for source_id in common if all(
        source_text(data[code], source_id).strip() for code in LANGUAGES
    )}
    existing_path = ROOT / "data/hadeethenc-candidates.json"
    existing = json.loads(existing_path.read_text())
    existing_ids = [str(row["provenance"]["sourceId"]) for row in existing]
    if not set(existing_ids).issubset(complete):
        raise ValueError("An existing five-language candidate is missing from these releases")

    def length(source_id):
        return max(len(source_text(data[code], source_id)) for code in CORE_LANGUAGES)

    def priority(source_id):
        label = data["en"][source_id].get("takhrij") or ""
        familiar = any(word in label.lower() for word in ("bukhari", "bukhār", "muslim", "agreed"))
        return (not familiar, length(source_id), int(source_id))

    # Retain the original 100 IDs, use every available Malay translation first,
    # then build the remaining translation backlog from the four-language pool.
    ranked = existing_ids + sorted(complete - set(existing_ids), key=priority)
    ranked += sorted(common - complete, key=priority)
    selected, duplicates, seen = [], [], set()
    for source_id in ranked:
        digest = fingerprint(source_text(data["ar"], source_id))
        if digest in seen:
            duplicates.append(source_id)
            continue
        seen.add(digest)
        selected.append(source_id)
        if len(selected) == count:
            break
    if len(selected) != count:
        raise ValueError(f"Only {len(selected)} unique candidates available for target {count}")

    candidates, snapshots = [], []
    for source_id in selected:
        available = [code for code in LANGUAGES if source_text(data[code], source_id).strip()]
        missing = [code for code in LANGUAGES if code not in available]
        original = {code: data[code][source_id] for code in available}
        english = original["en"]
        candidate = {
            "id": f"hadeethenc-{source_id}",
            "title": english["title"],
            "type": "Hadith",
            "category": "Editorial review",
            "arabic": original["ar"]["hadith_text"],
            "texts": {code: source_text(data[code], source_id) for code in LANGUAGES},
            "explanations": {code: original.get(code, {}).get("explanation") or "" for code in LANGUAGES},
            "source": english["takhrij"],
            "url": english["link"],
            "references": {
                code: {
                    "label": original[code]["takhrij"],
                    "url": original[code]["link"],
                    "publisher": "HadeethEnc.com",
                    "version": releases[code][1]["version"],
                } for code in available
            },
            "provenance": {
                "publisher": "HadeethEnc.com",
                "sourceId": source_id,
                "gradeArabic": original["ar"]["grade"],
                "grades": {code: original[code]["grade"] for code in available},
                "transcripts": {code: releases[code][1]["transcript"] for code in available},
                "sourceHashes": {code: releases[code][1]["sha256"] for code in available},
                "termsUrl": TERMS_URL,
            },
            "translationCoverage": {
                "requiredLanguages": list(LANGUAGES),
                "availableLanguages": available,
                "missingLanguages": missing,
                "complete": not missing,
            },
            "status": "Draft",
            "reviewed": False,
            "updated": date,
        }
        candidates.append(candidate)
        snapshots.append({"id": candidate["id"], "records": original})

    full = [row for row in candidates if row["translationCoverage"]["complete"]]
    report = {
        "collectedAt": date,
        "requestedCount": count,
        "collectedCandidates": len(candidates),
        "completeFiveLanguageCandidates": len(full),
        "fiveLanguageTargetMet": len(full) >= count,
        "missingTranslationCandidates": len(candidates) - len(full),
        "languageCoverage": {code: sum(bool(row["texts"][code]) for row in candidates) for code in LANGUAGES},
        "explanationCoverage": {code: sum(bool(row["explanations"][code]) for row in candidates) for code in LANGUAGES},
        "sourceIntersectionFourLanguages": len(common),
        "sourceIntersectionFiveLanguages": len(complete),
        "originalCandidateIdsRetained": len(set(existing_ids).intersection(selected)),
        "duplicateArabicTextsExcluded": duplicates,
        "sourceLabels": dict(Counter(row["source"] for row in candidates).most_common()),
        "sourceArabicGrades": dict(Counter(row["provenance"]["gradeArabic"] for row in candidates).most_common()),
        "maxRecordJsonBytes": max(len(json.dumps(row, ensure_ascii=False).encode()) for row in candidates),
        "published": 0,
        "reviewed": 0,
        "uploadedToFirestore": False,
    }
    return candidates, snapshots, report, {
        "publisher": "HadeethEnc.com",
        "termsUrl": TERMS_URL,
        "collectedAt": date,
        "contentPolicy": "Original text, explanations, and references are preserved; missing translations are not generated or substituted.",
        "releases": {code: releases[code][1] for code in LANGUAGES},
    }


def validate(candidates, snapshots, report):
    assert len(candidates) == report["requestedCount"]
    assert len({row["id"] for row in candidates}) == len(candidates)
    assert len({fingerprint(row["arabic"]) for row in candidates}) == len(candidates)
    for row, snapshot in zip(candidates, snapshots):
        assert row["status"] == "Draft" and row["reviewed"] is False
        assert row["arabic"] == row["texts"]["ar"]
        assert row["source"] and row["url"].startswith("https://hadeethenc.com/en/")
        for code in LANGUAGES:
            original = snapshot["records"].get(code)
            if original:
                assert row["texts"][code] == original["hadith_text"]
                assert row["explanations"][code] == (original.get("explanation") or "")
                assert row["references"][code]["url"] == original["link"]
                assert original["link"].endswith("/" + row["provenance"]["sourceId"])
            else:
                assert row["texts"][code] == "" and row["explanations"][code] == ""
                assert code not in row["references"]
        actual_missing = [code for code in LANGUAGES if not row["texts"][code]]
        assert actual_missing == row["translationCoverage"]["missingLanguages"]
        assert row["translationCoverage"]["complete"] == (not actual_missing)
    assert report["maxRecordJsonBytes"] < 900_000


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "data/collection-1000")
    parser.add_argument("--count", type=int, default=1000)
    parser.add_argument("--require-complete", action="store_true", help="exit with failure unless every selected hadith has all five source translations")
    args = parser.parse_args()
    if args.count < 100:
        parser.error("The catalog must retain the original 100 candidates")
    today = datetime.now(ZoneInfo("Asia/Makassar")).date().isoformat()
    candidates, snapshots, report, manifest = collect(args.source_dir, args.count, today)
    validate(candidates, snapshots, report)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    outputs = {
        "candidates.json": candidates,
        "complete-five-languages.json": [row for row in candidates if row["translationCoverage"]["complete"]],
        "missing-malay.json": [
            {"id": row["id"], "title": row["title"], "source": row["source"], "url": row["url"], "missingLanguages": row["translationCoverage"]["missingLanguages"]}
            for row in candidates if not row["translationCoverage"]["complete"]
        ],
        "coverage.json": report,
        "source-manifest.json": manifest,
    }
    for name, value in outputs.items():
        (args.output_dir / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with (args.output_dir / "source-records.jsonl").open("w", encoding="utf-8") as file:
        for row in snapshots:
            file.write(json.dumps(row, ensure_ascii=False) + "\n")
    print(json.dumps({key: report[key] for key in (
        "collectedCandidates", "completeFiveLanguageCandidates", "missingTranslationCandidates", "languageCoverage", "fiveLanguageTargetMet"
    )}, ensure_ascii=False, indent=2))
    if args.require_complete and not report["fiveLanguageTargetMet"]:
        raise SystemExit("Five-language target NOT met: complete the missing source translations first.")


if __name__ == "__main__":
    main()
