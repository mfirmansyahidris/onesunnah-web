"""Build an editorial draft set from HadeethEnc's official language downloads.

Requires openpyxl. Run with: python tools/build_hadeethenc_candidates.py
The output is for review; it is never published or uploaded automatically.
"""

from collections import Counter
from datetime import date
from pathlib import Path
from urllib.request import Request, urlopen
import argparse
import json
import re

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "hadeethenc"
OUTPUT = ROOT / "data" / "hadeethenc-candidates.json"
LANGUAGES = ("ar", "en", "id", "ms", "ur")
PREFERRED = (
    "4560",  # intentions
    "5437",  # good speech
    "4717",  # caring for others
    "4308",  # good character
    "4319",  # excellence in deeds
    "4568",  # charity
    "3567",  # remembrance
    "3716",  # fair dealing
    "3706",  # rights of a Muslim
    "3420",  # avoiding excess
)
# Editorial exclusions for the daily-reminder shortlist: repeated variants,
# technical/legal reports, eschatology, and passages needing extended context.
# They remain available in the official source for later specialist review.
EXCLUDED = set("""
4211 65023 65001 4311 65040 65019 65030 65036 65068 65031
65005 65021 65009 65050 65045 65051 66537 65004 4721 4792
65003 66519 4711 66535 4556 3390 65026 65032 65033 65034
65035 65037 65039 65044 65062 58240 65046 65007
""".split())


def rows_for(language: str, refresh: bool):
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / f"{language}.xlsx"
    if refresh or not path.exists():
        request = Request(
            f"https://hadeethenc.com/en/browse/download/{language}",
            headers={"User-Agent": "OneSunnahEditorialImport/1.0"},
        )
        with urlopen(request, timeout=45) as response:
            path.write_bytes(response.read())
    sheet = load_workbook(path, read_only=True, data_only=True).active
    values = iter(sheet.values)
    transcript = next(values)[0]
    columns = next(values)
    records = {str(row[0]): dict(zip(columns, row)) for row in values if row[0]}
    version = re.search(r"\(v([\d.]+)\)", transcript)
    if not version:
        raise ValueError(f"No source version in {language} workbook")
    return records, transcript, f"v{version.group(1)}"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--refresh", action="store_true", help="download the current release of every language spreadsheet")
    args = parser.parse_args()
    source = {language: rows_for(language, args.refresh) for language in LANGUAGES}
    common = set.intersection(*(set(source[language][0]) for language in LANGUAGES))
    ms = source["ms"][0]

    def length(hadith_id: str):
        return max(len(source[language][0][hadith_id]["hadith_text"] or "") for language in LANGUAGES)

    ranked = [hadith_id for hadith_id in PREFERRED if hadith_id in common]
    ranked += sorted(common - set(ranked) - EXCLUDED, key=lambda hadith_id: (length(hadith_id), int(hadith_id)))
    selected = []
    seen_titles = set()
    for hadith_id in ranked:
        title = re.sub(r"\s+", " ", ms[hadith_id]["title_ar"] or "").strip()
        if title in seen_titles:
            continue
        selected.append(hadith_id)
        seen_titles.add(title)
        if len(selected) == 100:
            break
    if len(selected) != 100:
        raise ValueError(f"Only {len(selected)} unique five-language candidates")

    candidates = []
    for hadith_id in selected:
        records = {language: source[language][0][hadith_id] for language in LANGUAGES}
        english = records["en"]
        candidates.append({
            "id": f"hadeethenc-{hadith_id}",
            "title": english["title"],
            "type": "Hadith",
            "category": "Editorial review",
            "arabic": records["ar"]["hadith_text"],
            "texts": {language: records[language]["hadith_text"] for language in LANGUAGES},
            "source": english["takhrij"],
            "url": english["link"],
            "references": {
                language: {
                    "label": records[language]["takhrij"],
                    "url": records[language]["link"],
                    "publisher": "HadeethEnc.com",
                    "version": source[language][2],
                }
                for language in LANGUAGES
            },
            "provenance": {
                "publisher": "HadeethEnc.com",
                "sourceId": hadith_id,
                "gradeArabic": records["ar"]["grade"],
                "transcripts": {language: source[language][1] for language in LANGUAGES},
            },
            "status": "Draft",
            "reviewed": False,
            "updated": date.today().isoformat(),
        })
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(candidates, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(candidates)} draft candidates to {OUTPUT}")
    print("Five-language intersection:", len(common))
    print("Source labels:", Counter(item["source"] for item in candidates).most_common(8))


if __name__ == "__main__":
    main()
